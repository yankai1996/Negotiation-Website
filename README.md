# RA-Website

A web app for business experiment on negotiation in supply chains.



## Requirements

The website is based on 

* Node.js
* MySQL

### Modules Dependency

* `express` - The website framework
* `mysql2`
* `sequelize` - A promise-based ORM for operating MySQL. View [Sequelize](http://docs.sequelizejs.com/).
* `cookie-parser`
* `morgan` 
* `socket.io` - For real-time bi-directional communication between the client s and server. View [Socket.IO](https://socket.io/).
* `socket.io-cookie`
* `browser-detect`
* `highcharts.js` - View [Highcharts](https://www.highcharts.com/).



## Experiment Description 

In this experiment, you will perform as a buyer or seller in the negotiations between supply chain partners.

### The Buyer's Problem

You are buying a unique product that you can resell for __$12__ in the market. The seller cannot access the market. The market will be available for __T = 10__ periods from now. In each period, either you or the seller will propose a price for this product and the other party will decide whether to accept or to reject the price. If the price is accepted, the negotiation ends; otherwise, the negotiation enters the next period. In each period when you negotiate, you will incur a fixed negotiation cost of __$0.1__. If an agreement is not reached after T = 10 periods, you will have nothing to sell.

There are two uncertainties in this process. First, the party that proposes the price in any period is random. The probability that you will get to propose a price is __&beta; = 60%__ (i.e., 40% chance the seller will get to propose the price). Second, there might be another buyer that will offer to buy the product at the price __w = $17__. If such a buyer exists, then in each period there is a probability of __&alpha; = 30%__ she will show up. If she shows up before you reach an agreement with the seller, she will get the product and your negotiation will end. The probability that another buyer exists is __&gamma; = 20%__.

Your goal is to maximize your profit by deciding what price to offer if you are asked to propose the price, and deciding whether you want to accept the price proposed by the seller.    

### The Seller's Problem

You are selling a unique product to a buyer. If the buyer buys the product, he can resell it for __$12__ in a market, which you cannot access. The market will be available to the buyer only for __T = 10__ periods from now. In each period, either you or the buyer will propose a price for this product and the other party will decide whether to accept or to reject the price. If the price is accepted, the negotiation ends; otherwise, the negotiation enters the next period. In each period when you negotiate, you will incur a fixed negotiation cost of __$0.1__. If an agreement is not reached after T = 10 periods, this buyer will leave.

There are two uncertainties in this process. First, the party that proposes the price in any period is random. The probability that the buyer will get to propose a price is __&beta; = 60%__ (i.e., 40% chance you will get to propose the price). Second, there might be another buyer that will offer to buy the product at the price __w = $17__. If such a buyer exists, then in each period there is a probability of __&alpha; = 30%__ she will show up. If the second buyer shows up before you reach an agreement with the first buyer, the second buyer will get the product and your negotiation with the first buyer will end. The second buyer may show up after T = 10 periods. The probability that the second buyer exists is __&gamma; = 20%__. If the product is not sold to the first buyer and the second buyer does not exist, you have to discard the product.

Your goal is to maximize your profit by deciding what price to offer if you are asked to propose the price, and deciding whether you want to accept the price proposed by the buyer.

### Parameters

| Variable      |                                                              |
| ------------- | ------------------------------------------------------------ |
| &alpha; = 0.3 | the probability that the second buyer, if exists, will show up in each period |
| &beta; = 0.6  | the probability that the buyer proposes the price in each period |
| &gamma; = 0.2 | the probability the second buyer exists                      |
| T = 10        | the maximum number of negotiation periods                    |
| w = 17        | the price that the second buyer will pay                     |

| Constant                       |
| ------------------------------ |
| Reselling price = $12          |
| Negotiation cost = $0.1/period |



## Installation

* [Download](https://github.com/yankai1996/RA-Website/archive/master.zip) and unzip the source code.
* Run `npm install`.
* Create a new MySQL database.
* Open `config.js`, customize the variables you need.
* Run `node server.js` to launch the website.

