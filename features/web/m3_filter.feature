Feature: Test filtre OIS300
Scenario: Filtrer une commande existante
 Given user opens Inform M3 Recette
 When user presses Ctrl R
 And user launches OIS300
 And user filters by establishment "2ME"
 And user filters by CDV "4045083125"
 And user selects first row
 And user opens MWS410 via option 43
 And user selects first row in MWS410 and runs option 32
 And user runs option 19 in MWS410
 And user exits MWS410 with f3