@echo off

echo Checking for existing build directory...
if exist build (
    echo Removing existing build directory...
    rmdir /s /q build
)

echo Setting NODE_ENV to production...
set NODE_ENV=production

echo Compiling TypeScript files...
call tsc -p .
call tsc-alias

echo Checking for .env file...
if exist .env (
    echo Copying environment variables...
    copy .env build\.env >nul
) else (
    echo No .env file found. Skipping...
)

echo Build completed successfully.