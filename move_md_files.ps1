$baseDir = "src\content\locations\conocoo-island-mainland"

# Get all area directories
Get-ChildItem -Path $baseDir -Directory | ForEach-Object {
    $areaDir = $_.FullName
    $areaName = $_.Name
    
    Write-Host "Processing area: $areaName"
    
    # Process towns directory
    $townsDir = Join-Path $areaDir "towns"
    if (Test-Path $townsDir -PathType Container) {
        # Get all town markdown files
        Get-ChildItem -Path $townsDir -Filter "*.md" | ForEach-Object {
            $townFile = $_.FullName
            $townName = $_.BaseName
            
            # Create a new filename with a prefix to avoid conflicts
            $newFileName = "town-$townName.md"
            $newFilePath = Join-Path $areaDir $newFileName
            
            # Copy the file to the area directory with the new name
            Copy-Item -Path $townFile -Destination $newFilePath
            Write-Host "Copied $townFile to $newFilePath"
        }
    }
    
    # Process cities directory
    $citiesDir = Join-Path $areaDir "cities"
    if (Test-Path $citiesDir -PathType Container) {
        # Get all city markdown files
        Get-ChildItem -Path $citiesDir -Filter "*.md" | ForEach-Object {
            $cityFile = $_.FullName
            $cityName = $_.BaseName
            
            # Create a new filename with a prefix to avoid conflicts
            $newFileName = "city-$cityName.md"
            $newFilePath = Join-Path $areaDir $newFileName
            
            # Copy the file to the area directory with the new name
            Copy-Item -Path $cityFile -Destination $newFilePath
            Write-Host "Copied $cityFile to $newFilePath"
        }
    }
}

Write-Host "File movement complete!"
