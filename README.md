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
* The instructor can add pairs of participants
* Automatically assign games to new added pairs, and vice versa
* Basic connection between participants and the server