# Submitting Fakemon
Adding fakemon to the game is one of the most exciting features to world building. 
<br>
You are welcome to design fakemon for any of the three monster origins in the world (Digimon, Pokemon, Yokai) which will all be visible in the same world fakemon dex. <br>
The most notable distinction between the different submission types is the way they are treated by evolution and rollers. <br>
A Digimon has multiple evolutions, a Yokai doesn't evolve, and a Pokemon traditionally follows a single, 1 2 or 3 stage evolution.

## General Submission Information
In general, there are a few things I need for any fakemon submission, as well as the unique "meta-data" that will be the information added to the roller, and is origin specific.
<br>
* Dex Number (ex 002) <br>
* Classification (the something pokemon / something digimon / something yokai)<br>
* Type(s)<br>
* Attribute (Data, Vaccine, Virus, Free, Variable)<br>
* Base Stats<br>
* An Image (and if you want, a shiny image)<br>
* Physical characteristics (height, weight, footprint, bodyshape) (for footprint and bodyshape, I will choose one of the ones I have on hand if you don't pick one)<br>
* Abilities<br>
* Pokedex Entry<br>
* Evolution Line<br>
* Any Artist Note / What name you'd like to be creditted as.<br>

if you're submitting an evolution line, you must submit the entire line at once.

### A NOTE ABOUT META DATA
The server is CASE SENSITIVE
I am on my hands and knees, please capitalize the first letter of each word, or as is logical.

# Origin Specific Information
## Pokemon
For Pokemon I need, comma seperated (or in a google sheets table) the following information :

|             |       |       |       |        |                         |        |                         |                        |                                 |                               |                      |             |             |                     |
|-------------|-------|-------|-------|--------|-------------------------|--------|-------------------------|------------------------|---------------------------------|-------------------------------|----------------------|-------------|-------------|---------------------|
| SpeciesName | Stage | Type1 | Type2 | Region | Dex Number (leave as 0) | Rarity | Is Starter (true/false) | Is Fossil (true/false) | Is PsuedoLegendary (true/false) | Is Sub-Legendary (true/false) | Is Baby (true/false) | EvolvesFrom | EvolvesInto | Breeding Results In |
|             |       |       |       |        |                         |        |                         |                        |                                 |                               |                      |             |             |                     |<br>

#### Pokemon Meta Data Notes:
Leave Dex Number Empty

Valid Rarities : Common, Mythical, Legendary



(You can copy this table into google sheets and fill it out there, it should automatically copy one entry per column)

Leave blanks for any that are empty. (I'm going to be copying it directly into the database, so having the correct format makes it better)

## Digimon
For Digimon I need, comma seperated (or in a google sheets table) the following information :

|      |                        |       |         |           |          |                 |                |
|------|------------------------|-------|---------|-----------|----------|-----------------|----------------|
| Name | xAntibody (true/false) | Stage | Type(s) | Attribute | Field(s) | PriorEvolutions | NextEvolutions |
<br>

#### Digimon Meta Data Notes:

Valid Types :
Wind, Earth, Lightning, Water, Earth

Valid Attributes :
Vaccine, Data, Virus, Free, Variable

Valid Stages :
Training 1, Training 2, Rookie, Champion, Ultimate, Mega, Armor, Hybrid, Ultra

Prior Evolutions and Next Evolutions can either be single entries or comma seperated lists.


(You can copy this table into google sheets and fill it out there, it should automatically copy one entry per column)

Leave blanks for any that are empty. (I'm going to be copying it directly into the database, so having the correct format makes it better)

## Yokai
For Yokai I need, comma seperated (or in a google sheets table) the following information :

|      |      |       |           |
|------|------|-------|-----------|
| Name | Rank | Tribe | Attribute |
<br>

#### Yokai Meta Data Notes:

Valid Ranks :
S, A, B, C, D, E

Valid Tribes :
Brave, Mysterious, Tough, Charming, Heartful, Shady, Eerie, Slippery, Wicked

Valid Attributes :
Earth, Earth, Fire, Wind, Ice, Drain,Lightning,Restoration,Wind,Water

(You can copy this table into google sheets and fill it out there, it should automatically copy one entry per column)

Leave blanks for any that are empty. (I'm going to be copying it directly into the database, so having the correct format makes it better)

