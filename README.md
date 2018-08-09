# RA-Website

A web app for experiment on negotiation in supply chains.

## Requirements

The website is based on 

* Node.js - The running environment
* MySQL - The database used

### Modules Dependency

* Express - The website framework
* Mysql2
* Sequelize - A promise-based ORM for operating MySQL
* Cookie-parser
* Morgan 
* Socket.IO - For real-time bi-directional communication between client and server

## Functions 

The following functions have been implemented:

### Instructor

* login/logout
* view/add/delete games
* add/delete/reset pairs of participants
* automatically assign games to new added pairs, and vice versa
* download experiment result
* clear data

### Participant
* login/logout
* read experiment description
* play one warm up game
* for each game, have 10s to prepare
* in each period, have 60s to propose a price and another 60s to decide to accept/reject the proposal
* view outcome after each game
* view summary at the end of the experiment

## Remaining Problems

* Safari dropping web socket connection when page not in focus for a while
* Security for fake socket connection
* Re-establishing the game when the browser is refreshed