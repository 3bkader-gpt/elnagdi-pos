@echo off
echo ===================================================
echo   Fixing Windows Time Sync (w32time reset)
echo ===================================================
echo.

net stop w32time
w32tm /unregister
w32tm /register
net start w32time
w32tm /config /manualpeerlist:"time.google.com,0x8 pool.ntp.org,0x8" /syncfromflags:manual /update
w32tm /resync /rediscover

echo.
echo ===================================================
echo   Done! System clock successfully resynchronized.
echo ===================================================
pause
