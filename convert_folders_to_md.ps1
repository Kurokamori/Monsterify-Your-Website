$baseDir = "src\content\locations\conocoo-island (Mainland)"

# Function to create a markdown file for a location
function Create-LocationMd {
    param (
        [string]$folderPath,
        [string]$outputPath,
        [string]$locationName,
        [string]$locationType
    )
    
    $formattedName = $locationName -replace '_', ' ' -replace '-', ' '
    $formattedName = (Get-Culture).TextInfo.ToTitleCase($formattedName)
    
    $content = "# $formattedName`n`n"
    
    switch ($locationType) {
        "architecture" {
            $content += "The architecture of $formattedName is characterized by unique design elements that reflect the region's culture and environment. Buildings and structures showcase distinctive features that have evolved over generations.`n`n"
            $content += "## Key Architectural Features`n`n"
            $content += "- **Local Materials**: Buildings utilize materials commonly found in the region`n"
            $content += "- **Climate Adaptation**: Designs are adapted to the local climate conditions`n"
            $content += "- **Cultural Motifs**: Decorative elements incorporate traditional symbols and patterns`n"
            $content += "- **Historical Influence**: Architecture shows influences from the region's historical development`n"
            $content += "- **Functional Integration**: Structures are designed to support local industries and lifestyle`n`n"
            $content += "Visitors to the region will notice how the built environment harmonizes with the natural landscape while serving the practical needs of the community."
        }
        "people" {
            $content += "The inhabitants of $formattedName have developed a rich culture shaped by their environment and history. Their society reflects unique traditions, values, and ways of life that visitors find fascinating.`n`n"
            $content += "## Culture and Society`n`n"
            $content += "- **Traditional Practices**: Local customs that have been preserved through generations`n"
            $content += "- **Social Structure**: How the community organizes itself and distributes responsibilities`n"
            $content += "- **Cuisine**: Distinctive food traditions using local ingredients`n"
            $content += "- **Festivals**: Regular celebrations that mark important seasonal or cultural events`n"
            $content += "- **Crafts and Arts**: Creative expressions that showcase local skills and aesthetics`n`n"
            $content += "The people of $formattedName welcome visitors who show respect for local traditions and are eager to share their cultural heritage with interested travelers."
        }
        "location" {
            $content += "This notable location in the region offers visitors a unique experience with its distinctive features and atmosphere. It serves as an important cultural, natural, or historical site.`n`n"
            $content += "## Features`n`n"
            $content += "- **Main Attraction**: The primary point of interest that draws visitors`n"
            $content += "- **Historical Significance**: The location's role in regional history`n"
            $content += "- **Natural Elements**: Notable natural features of the area`n"
            $content += "- **Cultural Importance**: How the location figures in local culture and traditions`n"
            $content += "- **Visitor Experience**: What travelers can expect when visiting`n`n"
            $content += "This location is accessible to visitors throughout most of the year, though local guides recommend specific seasons for the optimal experience."
        }
        "town" {
            $content += "This charming town serves as a community hub for the surrounding area, offering visitors a glimpse into local life and culture. With its distinctive character and amenities, it provides both necessities for residents and points of interest for travelers.`n`n"
            $content += "## Town Features`n`n"
            $content += "- **Central Square**: The heart of community activity and gatherings`n"
            $content += "- **Local Market**: Where regional goods and crafts are traded`n"
            $content += "- **Community Buildings**: Structures serving important social functions`n"
            $content += "- **Residential Areas**: Neighborhoods showcasing local architectural styles`n"
            $content += "- **Surrounding Environment**: How the town integrates with the natural landscape`n`n"
            $content += "Visitors will find accommodations, dining options, and opportunities to engage with local culture throughout the town."
        }
        "city" {
            $content += "This major urban center serves as an important hub for commerce, culture, and governance in the region. With its substantial population and developed infrastructure, it offers a wide range of experiences for visitors and residents alike.`n`n"
            $content += "## City Features`n`n"
            $content += "- **Urban Center**: The bustling heart of city activity and commerce`n"
            $content += "- **Distinctive Districts**: Various neighborhoods with their own character and purpose`n"
            $content += "- **Architectural Landmarks**: Notable buildings that define the city skyline`n"
            $content += "- **Cultural Institutions**: Museums, theaters, and other centers of arts and learning`n"
            $content += "- **Economic Drivers**: Industries and commercial activities that sustain the city`n"
            $content += "- **Transportation Network**: How people and goods move throughout the urban area`n"
            $content += "- **Public Spaces**: Parks, plazas, and gathering places for residents and visitors`n`n"
            $content += "The city welcomes visitors with various accommodation options, dining experiences, and cultural attractions that showcase the region's heritage and contemporary life."
        }
    }
    
    # Create the markdown file
    $content | Out-File -FilePath $outputPath -Encoding utf8
    Write-Host "Created $outputPath"
}

# Process all regions
Get-ChildItem -Path $baseDir -Directory | ForEach-Object {
    $regionDir = $_.FullName
    $regionName = $_.Name
    
    Write-Host "Processing region: $regionName"
    
    # Process about_the_architecture
    $archFolder = Join-Path $regionDir "about_the_architecture"
    if (Test-Path $archFolder -PathType Container) {
        $mdPath = Join-Path $regionDir "about_the_architecture.md"
        Create-LocationMd -folderPath $archFolder -outputPath $mdPath -locationName $regionName -locationType "architecture"
        Remove-Item -Path $archFolder -Recurse -Force
    }
    
    # Process about_the_people
    $peopleFolder = Join-Path $regionDir "about_the_people"
    if (Test-Path $peopleFolder -PathType Container) {
        $mdPath = Join-Path $regionDir "about_the_people.md"
        Create-LocationMd -folderPath $peopleFolder -outputPath $mdPath -locationName $regionName -locationType "people"
        Remove-Item -Path $peopleFolder -Recurse -Force
    }
    
    # Process regular locations (not towns or cities)
    Get-ChildItem -Path $regionDir -Directory | Where-Object { $_.Name -ne "towns" -and $_.Name -ne "cities" } | ForEach-Object {
        $locationFolder = $_.FullName
        $locationName = $_.Name
        
        # Skip if it's about_the_architecture or about_the_people
        if ($locationName -ne "about_the_architecture" -and $locationName -ne "about_the_people") {
            $mdPath = Join-Path $regionDir "$locationName.md"
            Create-LocationMd -folderPath $locationFolder -outputPath $mdPath -locationName $locationName -locationType "location"
            Remove-Item -Path $locationFolder -Recurse -Force
        }
    }
    
    # Process towns
    $townsDir = Join-Path $regionDir "towns"
    if (Test-Path $townsDir -PathType Container) {
        Get-ChildItem -Path $townsDir -Directory | ForEach-Object {
            $townFolder = $_.FullName
            $townName = $_.Name
            
            $mdPath = Join-Path $townsDir "$townName.md"
            Create-LocationMd -folderPath $townFolder -outputPath $mdPath -locationName $townName -locationType "town"
            Remove-Item -Path $townFolder -Recurse -Force
        }
    }
    
    # Process cities
    $citiesDir = Join-Path $regionDir "cities"
    if (Test-Path $citiesDir -PathType Container) {
        Get-ChildItem -Path $citiesDir -Directory | ForEach-Object {
            $cityFolder = $_.FullName
            $cityName = $_.Name
            
            $mdPath = Join-Path $citiesDir "$cityName.md"
            Create-LocationMd -folderPath $cityFolder -outputPath $mdPath -locationName $cityName -locationType "city"
            Remove-Item -Path $cityFolder -Recurse -Force
        }
    }
}

Write-Host "Conversion complete!"
