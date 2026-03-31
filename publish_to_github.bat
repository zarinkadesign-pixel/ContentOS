@echo off
:: ============================================================
:: ContentOS — автопубликация на GitHub
:: zarinkadesign-pixel/ContentOS
:: Запускать из папки D:\Content OS\
:: ============================================================
setlocal EnableDelayedExpansion

set REPO_OWNER=zarinkadesign-pixel
set REPO_NAME=ContentOS
set REPO_DESC=ContentOS — AI-powered content production system
set BRANCH=main

echo.
echo ===================================================
echo   ContentOS ^> GitHub публикация
echo   %REPO_OWNER%/%REPO_NAME%
echo ===================================================
echo.

:: --- Проверить git ---
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] git не найден. Установи: https://git-scm.com/download/win
    pause & exit /b 1
)

:: --- Проверить gh CLI ---
where gh >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] GitHub CLI не найден.
    echo Установи: winget install GitHub.cli
    echo Или скачай: https://cli.github.com/
    pause & exit /b 1
)

:: --- Авторизация ---
echo [1/5] Проверка авторизации GitHub...
gh auth status >nul 2>&1
if %errorlevel% neq 0 (
    echo Необходима авторизация. Открываю браузер...
    gh auth login --web --git-protocol https
    if %errorlevel% neq 0 (
        echo [ОШИБКА] Авторизация не выполнена.
        pause & exit /b 1
    )
)
echo      [OK] Авторизован

:: --- git init ---
echo [2/5] Инициализация git...
if not exist ".git" (
    git init -b %BRANCH%
    echo      [OK] git init
) else (
    echo      [OK] git уже инициализирован
)

:: --- Настройка remote ---
echo [3/5] Проверка remote...
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo      Создаю репозиторий на GitHub...
    gh repo create %REPO_OWNER%/%REPO_NAME% ^
        --public ^
        --description "%REPO_DESC%" ^
        --source=. ^
        --remote=origin ^
        --push
    if %errorlevel% neq 0 (
        echo [ОШИБКА] Не удалось создать репозиторий.
        pause & exit /b 1
    )
    echo      [OK] Репозиторий создан и код запушен!
    goto :done
) else (
    echo      [OK] remote origin уже есть
)

:: --- Добавить файлы ---
echo [4/5] Добавление файлов...
git add -A
git status --short

:: --- Commit + Push ---
echo [5/5] Commit и push...
for /f "tokens=*" %%i in ('git status --porcelain') do set HAS_CHANGES=1
if defined HAS_CHANGES (
    git commit -m "feat: initial ContentOS release"
    git push -u origin %BRANCH%
    if %errorlevel% neq 0 (
        echo.
        echo [ОШИБКА] Push не удался. Попробуй:
        echo   git push --force origin %BRANCH%
        pause & exit /b 1
    )
) else (
    echo      Нечего коммитить — всё актуально.
)

:done
echo.
echo ===================================================
echo   Готово!
echo   https://github.com/%REPO_OWNER%/%REPO_NAME%
echo ===================================================
echo.
start https://github.com/%REPO_OWNER%/%REPO_NAME%
pause
