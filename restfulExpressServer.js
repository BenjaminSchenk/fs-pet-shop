const express = require('express')
const fs = require('fs')
const path = require('path')
const petShopApp = express()
const port = 10000
petShopApp.use(express.urlencoded({ extended: false}))
const petsPath = path.join(__dirname, 'pets.json')
petShopApp.use(express.json())
const Pool  = require('pg').Pool



const pool = new Pool({
    user: 'benja',
    host: 'localhost',
    database: 'petshop',
    password: 'OASDIA',
    port: 5432
}) 

petShopApp.get('/:id', (req, res) => {
    let id = req.params.id
    if (id === 'pets/' || id === 'pets') {
    pool.query('SELECT * FROM pets', (err, data) => {
        if (err) {
            console.error(err)
        } 
        res.status(200).json(data.rows)
    })
} else {
    res.status(404).send('Not Found')
}
})

/*petShopApp.get('/:id', (req, res) => {
    let id = req.params.id
    if (id === 'pets/' || id === 'pets') {
        fs.readFile(petsPath, (err, data) => {
            err ? console.error(err) : res.status(200).send(JSON.parse(data))
        })
    } else {
        res.status(404).send('Not found')
    }
}) */

petShopApp.get('/pets/:id', (req, res) => {
    const id = parseInt(req.params.id)
    pool.query('SELECT * FROM pets WHERE id = $1', [id], (err, data) => {
        if (err) {
            console.error(err)
            res.status(500).send('Internal server error')
        } else if (data.rows.length === 0) {
            res.status(400).send('Bad request, try again, fool')
        } else {
           const resource = data.rows[0]
           res.status(200).send(resource)
        }
    })
})

/*petShopApp.get('/pets/:id', (req, res) => {
    fs.readFile(petsPath, (err, data) => {
        const id = req.params.id
        const petData = JSON.parse(data)
        if (err) {
            console.error(err)
        } else if (id >= 0 && id <= petData.length - 1) {
            res.status(200).send(petData[id])
        } else {
            res.status(400).send('Bad request, try again, fool')
        }
    })
}) */

petShopApp.post('/pets', (req, res) => {
    const { age, kind, name } = req.body
    if (req.body.age && req.body.kind && req.body.name) {
    pool.query('INSERT INTO pets (age, kind, name) VALUES ($1, $2, $3)', [age, kind, name], (err, data) => {
        if (err) {
            console.error(err)
            res.status(500).send('Internal server error')
        } else  if (typeof req.body === 'object') {
            res.status(201).send('Pet successfully added!')
        } else {
            res.status(400).send('Nice try, use an object next time')
        }
    })
    } else {
        res.status(400).send('Nice try, missing something')
    }
})

/*petShopApp.post('/pets', (req, res) => {
    fs.readFile(petsPath, (err, data) => {
        if (err) {
            console.error(err) 
        } else {
            const petData = JSON.parse(data) 
            if (typeof req.body === 'object') {
                petData.push(req.body)
                fs.writeFile(petsPath, JSON.stringify(petData), (err) => {
                    if (err) {
                        console.error(err)
                    } else {
                        res.status(200).send(petData)
                    } 
                })
            } else {
                res.status(400).send('Nice try, use an object next time')
            }
        }
    })
}) */

petShopApp.patch('/pets/:id', async (req, res) => {
    // destructuring the id and defining the request body as variable updates
    const { id } = req.params
    const updates = req.body
    // try catch block for async await syntax
    try {
        let query = 'UPDATE pets SET ' // defining base query string, to be updated later 
        const values = [] // defining empty array for later values
        Object.keys(updates).forEach((column, index) => { // calling a function on each element of the newly created array of keys from the request body (updates)
            query += `${column} = $${index + 1}, ` // adding the column name and index to the query string, solved for a 1 indexed database
            values.push(updates[column]) // pushing the column key into the values array
        })

        query = query.slice(0, -2) // slicing off the trailing comma and space
        query += ` WHERE id = $${Object.keys(updates).length + 1} RETURNING *` // adding the WHERE clause with the id being equal to the last index of the newly generated updates array
        values.push(id) // pushing the id into the values array

        const result = await pool.query(query, values) 
        if (result.rowCount === 0) {
            res.status(404).send('Pet not found')
        } else {
            res.json(result.rows[0])
        }
    } catch (err) {
        console.error(err)
        res.status(500).send('Internal Server Error')
    }
})


/*petShopApp.patch('/pets/:id', (req, res) => {
    fs.readFile(petsPath, (err, data) => {
        let petData = JSON.parse(data)
        if (err) {
            console.error(err)
        } else {
            let newPet = req.body
            let id = req.params.id
            if (newPet.age || newPet.kind || newPet.name) {
                for (let key in petData[id]) {
                    if (newPet[key]) {
                        petData[id][key] = newPet[key]
                    }
                    
                }
                fs.writeFile(petsPath, JSON.stringify(petData), (err) => {
                    err ? console.error(err) : res.status(200).send(petData)
                })
            } else {
                res.status(400).send('Bad request')
            }
        } 
    }) 
}) */

petShopApp.delete('/pets/:id', (req, res) => {
    const id = parseInt(req.params.id)
    pool.query('DELETE FROM pets WHERE id = $1', [id], (err, data) => {
        if (err) {
            console.error(err)
            res.status(500).send('Internal server error')
        } else {
            res.status(200).send('Pet is gone now.')
        } 
    })
})


/*petShopApp.delete('/pets/:id', (req, res) => {
    fs.readFile(petsPath, (err, data) => {
        let petData = JSON.parse(data)
        if (err) {
            console.error(err) 
        } else {
            const id = req.params.id
            let formerPet = petData[id]
            petData.splice(formerPet, 1)
            fs.writeFile(petsPath, JSON.stringify(petData), (err) => {
                if (err) {
                    console.error(err)
                } else {
                    res.status(200).send('Pet is gone now.')
                }
            })
        }
    })
}) */

petShopApp.use((req, res) => {
    res.status(404).send('Not found')
})


petShopApp.listen(port, () => {
    console.log('Server\'s up on', port)
})

/*pool.query('SELECT * FROM pets', (err, data) => {
    if (err) {
        console.error(err)
    } else {
        console.log(data.rows)
    }
}) */

