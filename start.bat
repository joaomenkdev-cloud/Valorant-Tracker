@echo off
echo ============================================
echo   VCI Analytics - Backend Python/Flask
echo ============================================
echo.

cd /d "%~dp0server"

REM Instala dependencias se necessario
echo Verificando dependencias...
pip install -r requirements.txt --quiet

echo.
echo Iniciando servidor na porta 3001...
echo Health check: http://localhost:3001/api/health
echo.
echo Pressione Ctrl+C para parar o servidor.
echo.

python server.py
pause
