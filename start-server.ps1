$http = [System.Net.HttpListener]::new()
$http.Prefixes.Add("http://0.0.0.0:8080/")
$http.Start()

$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*"} | Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "SERVIDOR INICIADO!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Para ver la pagina desde tu celular:" -ForegroundColor Yellow
Write-Host "1. Conecta tu celular a la misma red WiFi" -ForegroundColor Cyan
Write-Host "2. Abre el navegador en tu celular" -ForegroundColor Cyan
Write-Host "3. Ingresa esta URL:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   http://$($localIP):8080/index.html" -ForegroundColor White -BackgroundColor DarkGreen
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

while ($http.IsListening) {
    $context = $http.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $path = $request.Url.LocalPath
    if ($path -eq "/") { $path = "/index.html" }

    $filePath = Join-Path $PWD $path.TrimStart('/')
    
    if (Test-Path $filePath) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentLength64 = $content.Length
        
        # Set content type
        $ext = [System.IO.Path]::GetExtension($filePath)
        switch ($ext) {
            ".html" { $response.ContentType = "text/html; charset=utf-8" }
            ".css" { $response.ContentType = "text/css; charset=utf-8" }
            ".js" { $response.ContentType = "application/javascript; charset=utf-8" }
            ".png" { $response.ContentType = "image/png" }
            ".jpg" { $response.ContentType = "image/jpeg" }
            ".jpeg" { $response.ContentType = "image/jpeg" }
            ".gif" { $response.ContentType = "image/gif" }
            ".mp4" { $response.ContentType = "video/mp4" }
            ".webp" { $response.ContentType = "image/webp" }
            default { $response.ContentType = "application/octet-stream" }
        }
        
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
        $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 - File not found")
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
    }
    
    $response.Close()
}

$http.Stop()
