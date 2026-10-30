#!/usr/bin/env python3
"""Reject credentials and original household identifiers without printing values."""
import re
import hashlib
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATTERNS = {
    'Google API key': re.compile(rb'AIza[0-9A-Za-z_-]{30,}'),
    'GitHub token': re.compile(rb'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})'),
    'OpenAI-style key': re.compile(rb'\bsk-(?:proj-)?[A-Za-z0-9_-]{30,}'),
    'AWS access key': re.compile(rb'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b'),
    'hardcoded credential': re.compile(rb'(?:api[_-]?key|access[_-]?token|client[_-]?secret)\s*[\"\']?\s*[:=]\s*[\"\'][A-Za-z0-9_+/=-]{24,}[\"\']', re.I),
    'private key': re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    'personal email': re.compile(rb'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'),
}


# Hashes keep removed identifiers out of the public audit source.
REMOVED_NAME_HASHES = {'7c8ccc86c11654af029457d90fdd9d013ce6fb011ee8fdb1374832268cc8d967', '4bdbc215d8dc3c571e802a69bced0c3071cc4a1f129ad97e15b357018aac6cd4', '16b02287e8a9f1d5bb5a4afacaf6ac7124c62846bad58d8f48acc27598a2cb7a', '86846e84f9bfb2053a4823193843d22a0be24a75d304d6f8a2e4d2fac445efaa'}

def scan(label, data):
    findings = [name for name, pattern in PATTERNS.items() if pattern.search(data)]
    words = re.findall(rb'[A-Za-z]+', data.lower())
    # The user confirmed the original example report's names and data are fictional.
    report_paths = ('example-report.html', 'js/example-report.js')
    fictional_report = label in report_paths or any(label.endswith(' (' + path + ')') for path in report_paths)
    if not fictional_report and any(hashlib.sha256(word).hexdigest() in REMOVED_NAME_HASHES for word in words):
        findings.append('original household identifier')
    for name in findings:
        print(f'FAIL: {name} in {label}')
    return bool(findings)


def main():
    failed = False
    files = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).split(b'\0')
    for file in filter(None, files):
        path = ROOT / file.decode()
        if file.decode() == 'js/config.js' or (path.name.startswith('.env') and path.name != '.env.example'):
            print(f'FAIL: local configuration is tracked: {file.decode()}')
            failed = True
        if path.is_file():
            failed |= scan(file.decode(), path.read_bytes())
    if '--working-tree' in sys.argv:
        for path in ROOT.rglob('*'):
            if path.is_file() and '.git' not in path.relative_to(ROOT).parts:
                failed |= scan(str(path.relative_to(ROOT)), path.read_bytes())
    if '--history' in sys.argv:
        objects = subprocess.check_output(['git', 'rev-list', '--objects', '--all'], cwd=ROOT).splitlines()
        for entry in objects:
            oid, _, name = entry.partition(b' ')
            if not name:
                continue
            kind = subprocess.check_output(['git', 'cat-file', '-t', oid], cwd=ROOT).strip()
            if kind == b'blob':
                data = subprocess.check_output(['git', 'cat-file', 'blob', oid], cwd=ROOT)
                failed |= scan(f'history blob {oid.decode()[:12]} ({name.decode()})', data)
    if failed:
        return 1
    print('PASS: scanned tracked files' + (' and ignored working files' if '--working-tree' in sys.argv else '') + (' and all reachable Git history' if '--history' in sys.argv else ''))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
