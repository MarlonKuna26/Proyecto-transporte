@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
call node_modules\.bin\vite.cmd preview --host 0.0.0.0
