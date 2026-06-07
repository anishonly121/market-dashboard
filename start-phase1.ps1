# Start the Phase 1 Streamlit dashboard.
# Run from the market-dashboard root: .\start-phase1.ps1

Write-Host "Starting Phase 1 Streamlit dashboard..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "cd '$PSScriptRoot\phase1-streamlit'; python -m streamlit run app.py" `
  -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "  Dashboard -> http://localhost:8501" -ForegroundColor Green
Write-Host ""
Write-Host "Close the new terminal window to stop." -ForegroundColor Yellow
