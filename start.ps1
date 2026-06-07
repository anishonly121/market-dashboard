# Start the full Phase 2 stack (backend + frontend) in two terminal windows.
# Run from the market-dashboard root: .\start.ps1

Write-Host "Starting Market Dashboard..." -ForegroundColor Cyan

# Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "cd '$PSScriptRoot\backend'; python -m uvicorn app.main:app --reload --port 8000" `
  -WindowStyle Normal

Start-Sleep -Seconds 2

# Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "cd '$PSScriptRoot\frontend'; npm run dev" `
  -WindowStyle Normal

Write-Host ""
Write-Host "  Backend  -> http://localhost:8000/docs" -ForegroundColor Green
Write-Host "  Frontend -> http://localhost:5173"      -ForegroundColor Green
Write-Host ""
Write-Host "Close the two new terminal windows to stop." -ForegroundColor Yellow
