"""Repository protection and sandboxed working copies.

Protection is by repository IDENTITY (git remote), not only by path: a clone of
a protected repo is refused wherever it lives on disk.

Agents never work in a source checkout. For an allowed repo they get a private
`git clone` inside their team workspace, on a `workforce/<task_id>` branch, with
pushing disabled. The source checkout is only read. Test commands come from
config only - never from a task payload or model output.
"""
from __future__ import annotations

import os
import re
import shlex
import subprocess
import time
from pathlib import Path


class RepoPolicyError(PermissionError):
    pass


_SECRET_ENV = re.compile(r"(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)", re.I)


def _git_config_text(start: Path) -> str | None:
    """Return the text of the git config governing `start`, or None if not in a repo."""
    p = start if start.is_dir() else start.parent
    for d in [p, *p.parents]:
        g = d / ".git"
        if g.is_dir():
            cfg = g / "config"
        elif g.is_file():  # worktree or submodule: "gitdir: <path>"
            m = re.match(r"gitdir:\s*(.+)", g.read_text().strip())
            if not m:
                continue
            gd = (d / m.group(1)).resolve()
            common = gd / "commondir"
            cfg = ((gd / common.read_text().strip()).resolve() if common.exists() else gd) / "config"
        else:
            continue
        try:
            return cfg.read_text()
        except OSError:
            return ""
    return None


def repo_slugs_at(path: Path) -> set[str]:
    """owner/name slugs of every remote of the repo containing `path` (lower-case)."""
    text = _git_config_text(Path(path))
    if not text:
        return set()
    slugs = set()
    for url in re.findall(r"^\s*(?:push)?url\s*=\s*(\S+)", text, re.M | re.I):
        m = re.search(r"[:/]([^/:\s]+/[^/\s]+?)(?:\.git)?/?$", url)
        if m:
            slugs.add(m.group(1).lower())
    return slugs


def scrubbed_env() -> dict:
    """Environment for sandboxed commands: no secret-looking variables.

    GIT_CONFIG_COUNT/KEY_n/VALUE_n are an all-or-nothing group (git fails if only
    part of it is present) and can carry credentials, so the whole group is dropped.
    """
    env = {k: v for k, v in os.environ.items()
           if not _SECRET_ENV.search(k) and not k.startswith("GIT_CONFIG_")}
    env["CI"] = "1"
    return env


class RepoPolicy:
    def __init__(self, root: Path, cfg: dict):
        prot = cfg.get("protection", {})
        self.root = Path(root).resolve()
        self.protected_repos = {s.lower() for s in prot.get("protected_repos", [])}
        cands = list(cfg["paths"].get("protected_paths", []))
        cands += [p for p in os.environ.get("APS_PROTECTED_PATHS", "").split(os.pathsep) if p]
        self.protected_paths = [(self.root / p).resolve() for p in cands]
        self.repos = {k.lower(): v for k, v in (cfg.get("repos") or {}).items()}
        self.test_timeout = float(prot.get("test_timeout_seconds", 600))

    # ------------------------------------------------------------ protection
    def existing_protected_paths(self) -> list[Path]:
        return [p for p in self.protected_paths if p.exists()]

    def is_protected(self, path: Path) -> str | None:
        """Reason string if `path` is inside a protected path or repo, else None."""
        p = Path(path).resolve()
        for prot in self.protected_paths:
            if p == prot or prot in p.parents:
                return f"inside protected path {prot}"
        hit = repo_slugs_at(self._nearest_existing(p)) & self.protected_repos
        if hit:
            return f"inside protected repository {sorted(hit)[0]}"
        return None

    @staticmethod
    def _nearest_existing(p: Path) -> Path:
        while not p.exists() and p != p.parent:
            p = p.parent
        return p

    def check_repo_allowed(self, slug: str):
        s = slug.lower()
        if s in self.protected_repos:
            raise RepoPolicyError(f"{slug} is a protected repository; the workforce may not work on it")
        if s not in self.repos:
            raise RepoPolicyError(f"{slug} is not in the workforce's allowed repos list")

    # ------------------------------------------------------------ sandboxes
    def find_source(self, slug: str) -> Path:
        self.check_repo_allowed(slug)
        name = slug.split("/")[-1]
        cands = [self.root.parent / name, self.root.parent.parent / name, self.root.parent]
        cands += [Path(p) for p in self.repos[slug.lower()].get("local_paths", [])]
        for c in cands:
            c = (self.root / c).resolve()
            if c.exists() and slug.lower() in repo_slugs_at(c) and (c / ".git").exists():
                return c
        raise RepoPolicyError(f"no local checkout of {slug} found (looked in {[str(c) for c in cands]})")

    def prepare(self, team_root: Path, task_id: str, slug: str) -> Path:
        """Private clone on branch workforce/<task_id>; push disabled; source untouched."""
        src = self.find_source(slug)
        dest = (Path(team_root) / "repos" / task_id / slug.split("/")[-1]).resolve()
        if Path(team_root).resolve() not in dest.parents:
            raise RepoPolicyError("sandbox path escapes team workspace")
        if not dest.exists():
            dest.parent.mkdir(parents=True, exist_ok=True)
            self._git(["clone", "--quiet", "--no-hardlinks", str(src), str(dest)], cwd=dest.parent)
            self._git(["checkout", "--quiet", "-b", f"workforce/{task_id}"], cwd=dest)
            self._git(["remote", "set-url", "--push", "origin", "PUSH_DISABLED_needs_human_approval"], cwd=dest)
        return dest

    @staticmethod
    def _git(args: list[str], cwd: Path):
        subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True,
                       timeout=300, env=scrubbed_env())

    def run_tests(self, slug: str, workdir: Path) -> dict:
        cmd = self.repos[slug.lower()].get("test_command")
        if not cmd:
            return {"type": "no_test_command", "repo": slug,
                    "note": "no test_command configured for this repo"}
        argv = shlex.split(cmd) if isinstance(cmd, str) else list(cmd)
        env = scrubbed_env()
        t0 = time.time()
        try:
            r = subprocess.run(argv, cwd=workdir, env=env, capture_output=True, text=True,
                               timeout=self.test_timeout)
            code, out = r.returncode, (r.stdout + "\n" + r.stderr)
        except subprocess.TimeoutExpired as e:
            code, out = 124, f"TIMEOUT after {self.test_timeout}s\n{e.stdout or ''}"
        except FileNotFoundError as e:
            code, out = 127, f"command not found: {e}"
        head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=workdir, capture_output=True,
                              text=True).stdout.strip()
        return {"type": "test_run", "repo": slug, "commit": head, "command": " ".join(argv),
                "exit_code": code, "duration_seconds": round(time.time() - t0, 2),
                "output_tail": out[-4000:]}
