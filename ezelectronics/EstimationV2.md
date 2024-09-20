# Project Estimation - CURRENT
Date:

Version:


# Estimation approach
Consider the EZElectronics  project in CURRENT version (as given by the teachers), assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch
# Estimate by size
### 
|             | Estimate                        |             
| ----------- | ------------------------------- |  
| NC =  Estimated number of classes to be developed   |               34            |             
|  A = Estimated average size per class, in LOC       |     39                       | 
| S = Estimated size of project, in LOC (= NC * A) | 1350 | 
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)  |                 135                     |   
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro) | 4050| 
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) |             4  |               

# Estimate by product decomposition
### 
|         component name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
| requirement document    |24|
| GUI prototype |16|
| design document |32|
| code |135|
| unit tests |174|
| api tests |102|
| management documents  |18|



# Estimate by activity decomposition
### 
|         Activity name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
| Definizione requisiti del sistema| 30|
| Progettazione prototipo GUI |14|
|Design del sistema|39|
|Traduzione requisiti in codice|140|
|Unit Test|172|
|Test API|107|
|Scrittura management documents|14|
###

![Activities](Immagini/gantt2V2.png)
![Gantt Chart](Immagini/gantt1V2.png)
# Summary

Report here the results of the three estimation approaches. The  estimates may differ. Discuss here the possible reasons for the difference

|             | Estimated effort                        |   Estimated duration |          
| ----------- | ------------------------------- | ---------------|
| estimate by size |135| 33|
| estimate by product decomposition |501| 125 |
| estimate by activity decomposition |516| 129|

Le differenze sono dovute alla natura delle stime, nel caso della stima per dimensione consideriamo il progetto nell'insieme calcolando LOC e producendo quindi una stima.
Nel caso invece della stima per prodotto si divide per le sue parti costituitenti(caratteristiche), ed ogni parte è considerata per complessità e altri fattori.
Infine la stima più accurata per questo progetto è la stima per attività in quanto viene considerato l'effort che effettivamente richiede una certa attività. 


