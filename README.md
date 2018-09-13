# RA-Website

A web app for experiment on negotiation in supply chains.
The *version 2* is under development...

## Requirements

The website is based on 

* Node.js - The running environment
* MySQL - The database used

### Modules Dependency

* express - The website framework
* mysql2
* sequelize - A promise-based ORM for operating MySQL
* cookie-parser
* morgan 
* socket.io - For real-time bi-directional communication between client and server
* socket.io-cookie
* highcharts.js

## Functions 

The following functions have been implemented:

### Instructor

* login/logout
* view/add/delete master games
* add/delete/reset pairs of participants
* automatically assign games to new added pairs, and vice versa
* view the distribution of profit
* download experiment result
* clear data
* pause/resume games

### Participant
* login/logout
* read experiment description
* play one warm-up game
* for each game, have 10s to prepare
* in each period, have 60s to propose a price and another 60s to decide to accept/reject the proposal
* view outcome after each game
* view summary at the end of the experiment

## Remaining Problems

* Safari dropping web socket connection when page not in focus for a while
* One account logging in at the same time