@echo off
setlocal enabledelayedexpansion
title Lar Esperanca - Git Push Inicial
color 0E

echo ============================================
echo   LAR ESPERANCA - GIT PUSH INICIAL
echo ============================================
echo.

REM --- Verifica se esta na pasta do projeto ---
if not exist "package.json" (
    echo [ERRO] package.json nao encontrado.
    echo Execute este arquivo dentro da pasta do projeto.
    pause
    exit /b 1
)

REM --- Verifica Git ---
where git >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Git nao encontrado.
    echo Baixe em https://git-scm.com/download/win
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('git --version') do echo [OK] %%v detectado.
echo.

REM --- Verifica se ja existe repositorio ---
if exist ".git" (
    echo [AVISO] Ja existe um repositorio Git nesta pasta.
    set /p RECRIAR="Deseja continuar mesmo assim? (S/N): "
    if /i not "!RECRIAR!"=="S" (
        echo Operacao cancelada.
        pause
        exit /b 0
    )
) else (
    echo [1/6] Inicializando repositorio...
    git init
    if errorlevel 1 (
        echo [ERRO] Falha ao inicializar o repositorio.
        pause
        exit /b 1
    )
)

echo.
echo [2/6] Configurando branch principal como main...
git branch -M main

echo.
REM --- Verifica identidade Git ---
git config user.email >nul 2>nul
if errorlevel 1 (
    echo [AVISO] Identidade Git nao configurada nesta maquina.
    set /p GITEMAIL="Digite seu e-mail do GitHub: "
    set /p GITNOME="Digite seu nome: "
    git config user.email "!GITEMAIL!"
    git config user.name "!GITNOME!"
    echo [OK] Identidade configurada.
) else (
    for /f "tokens=*" %%e in ('git config user.email') do echo [OK] Identidade: %%e
)

echo.
echo [3/6] Adicionando arquivos...
git add .
if errorlevel 1 (
    echo [ERRO] Falha ao adicionar arquivos.
    pause
    exit /b 1
)

echo.
echo [4/6] Criando commit inicial...
git commit -m "Projeto Lar Esperanca - campanha de doacao de Natal"
if errorlevel 1 (
    echo.
    echo [AVISO] Nada para commitar ou commit falhou.
    echo Verifique se os arquivos existem na pasta.
)

echo.
echo [5/6] Configurando repositorio remoto...
echo.
echo Cole a URL do repositorio no GitHub.
echo Exemplo: https://github.com/SEU-USUARIO/lar-esperanca.git
echo.
set /p REPOURL="URL do repositorio: "

if "!REPOURL!"=="" (
    echo [ERRO] URL vazia. Operacao cancelada.
    pause
    exit /b 1
)

git remote remove origin >nul 2>nul
git remote add origin "!REPOURL!"
if errorlevel 1 (
    echo [ERRO] Falha ao configurar o remoto.
    pause
    exit /b 1
)
echo [OK] Remoto configurado.

echo.
echo [6/6] Enviando para o GitHub...
echo.
git push -u origin main
if errorlevel 1 (
    echo.
    echo [ERRO] Falha no push.
    echo.
    echo Causas comuns:
    echo   - Repositorio remoto ja tem commits (rode: git pull origin main --allow-unrelated-histories)
    echo   - Autenticacao falhou (configure um Personal Access Token)
    echo   - URL do repositorio incorreta
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   PUSH CONCLUIDO
echo ============================================
echo.
echo Repositorio: !REPOURL!
echo.
echo Proximo passo: importe o repositorio na Vercel
echo e cadastre as 6 variaveis de ambiente.
echo.
pause
endlocal