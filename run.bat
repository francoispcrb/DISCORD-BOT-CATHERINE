@echo off
for /f "delims=" %%v in ('node win/getVersion.js') do set VERSION=%%v

title Catherine Bot - %VERSION%

node start online
pause
