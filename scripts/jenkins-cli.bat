@echo off
REM ============================================
REM  查看 Jenkins 密码脚本 (Windows)
REM ============================================

echo ===========================================
echo  获取 Jenkins 初始管理员密码
echo ===========================================
echo.

docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

echo.
pause
