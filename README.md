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

* Login/logout for the instructor and participants
* The instructor can view/add/delete games
* The instructor can add/delete/reset pairs of participants
* The instructor can download experiment result
* Automatically assign games to new added pairs, and vice versa
* Game play between participants

## Remaining Problems

* Safari dropping web socket connection when page not in focus for a while
* Security for fake socket connection
* Re-establishing the game when the browser is refreshed