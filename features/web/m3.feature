Feature: Création + Livraison M3
Scenario: Créer une commande et passer en livré
 Given user opens Inform M3 Recette
 When user presses Ctrl R
 And user launches OIS300
 And user clicks on new order
 And user fills order header
 And user fills customer order number
 And user fills product and quantity and presses Enter
 And user copies the CDV number
 # sortir de OIS100 jusqu’à OIS300
 And user exits OIS100 to OIS300 with F3
 # maintenant on est bien dans OIS300
 And user filters by establishment "2ME"
 And user filters by CDV "COPIED"
 And user selects first row
 And user opens MWS410 via option 43
 And user selects first row in MWS410 and runs option 32
 And user runs option 19 in MWS410
 And user exits MWS410 to OIS300 with F3 