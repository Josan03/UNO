# Yahtzee

This is an implementation of multi-player Yahtzee. It uses (or at least approximates the Danish rules).

## Running the application
Get the project from github 
```
git clone https://github.com/olehougaard/yahtzee
```

### Install
This is an npm project, so install first.
```
npm install
```

### Start the application
The application has three workspaces
1.server - responsible for getting game updates from the client. Uses pubsub to broadcast updates.
2. client - responsible for letting the user play a game.

You can start the entire application by running the following commands.
```
npm start --workspace=server
npm start --workspace=client
```
They block, so you need to run them in three different terminals or start them in the background.

You can access the client on http://localhost:5173/

## Using the application
First, you need to first login to the application. There is no password, so it's free for all.

You will first enter the lobby. In the lobby, you can create new games with 1 or more players.

### The navigation bar
The navigation bar is on the right-hand side. It has 4 sections

1. The lobby - returns to the lobby
2. Your ongoing games - you can participate in several games at the same time. They are shown on the right-hand side.
3. Your pending games - these are the games you have created, but don't have enough participants to start
4. Other pending games - these are the games other players have created, but don't have enough participants to start. You can join these games.

### Playing the game
The game is played by alternating rolling dice and scoring the result in the score sheet.

The first roll is automatically performed by the game. You can re-roll up to two times. Each time, you can elect to hold dice that won't be re-rolled.

You can choose to score the result in the score sheet after any of the rolls. You can score the result in any category that doesn't already have a score (or is scratched), except Sum, Bonus and Total.

#### Scratching
If you score a roll on a category that's not eligible (e.g., you choose 4-of-a-kind, but you don't have 4 dice with the same number), the field will be _scratched_. Scratched fields are scored as 0 and can't be retried.

Sometimes you will be forced to scratch, when no category is eligible. Sometimes you will elect to scratch, because is better than to lose your bonus or score a bad result.

#### Upper section
In the upper section, you get a score that's the sum of the dice that has the right number (i.e. if you have 3 4s, you will score 12 in the 4 category).

The target is a guidance for getting the _bonus_ (see below).

#### Bonus
If you get at least 63 points in the upper section, you will get a bonus of 50. This is often key to winning the game.

#### Lower section
The lower section has a number disparate categories that have different rules of eligibility. 
- pair: You need 2 dice with the same number. Scores the sum of the two dice. If you have two pair, the highest pair is counted. 
- two pair: You need 2 pairs. A full house is also eligible here. Scores the sum of the 4 dice.
- three-of-a-kind: You need 3 dice with the same number (including full house). Scores the sum of the 3 dice.
- four-of-a-kind: You need 4 dice with the same number. Scores the sum of the 4 dice.
- small straight: The numbers 1, 2, 3, 4, 5 in any order. Scores 15
- large straight: The numbers 2, 3, 4, 5, 6 in any order. Scores 20
- full house: three-of-a-kind + a pair. five-of-a-kind does _not_ count as a full house.
- chance: All rolls are eligible. The score is the sum of the dice.
- yahtzee: five-of-a-kind. The score is 50.

#### Winning
The winner is the player with the highest score.

## The code
The code is separated into 4 workspaces.

### models
The rules of the game. This is written in functional style, and is the only workspace that is unit tested.

You shouldn't need to change this code, but might want to look at it.

### server
The server implementing the game system. The server is a GraphQL service. It broadcasts the changes through subscriptions.

If the server isn't set up with MongoDB, it persists nothing, so every time you restart the server it contains only game 0 (see below).

See `server/yahtzee.sdl` for the services offered by the server.

### Client
The client is implemented in React using react-router, redux and RxJS.

It has four views (routes):
1. Login - the login page 
2. Lobby - this is where we create a game
3. Game - this is where we play a game
4. Pending - to see a pending game and join if we haven't already

The game view uses three components:
1. Page - a wrapper component to show headings and navigation bar.
2. ScoreCard - represent the score card and allows players to score their rolls.
3. DiceRoll - represents the area where the dice are rolled and allows players to hold and re-roll.

### Known bugs
- The first client opened after `npm start -w client` often requires a refresh before it can listen to changes from the server.

## Game 0
Game 0 is a test game hard-coded between Alice and Bob. It is useful to test the end-game as it is almost finished.

You need two player to log in as Alice and Bob, to play the game.
