
const functions = require('./functions')
//const getUrls = require('get-urls')

/* request apis */
const request = require('request-promise')
const cheerio = require('cheerio');

/* COVID-19 Statistics API Documentation
Based on public data by Johns Hopkins CSSE */

  var dailyUSAData = {
    method: 'GET',
    url: 'https://covid-19-statistics.p.rapidapi.com/reports',
    qs: {
      iso: 'USA',
      region_name: 'US',
      city_name: '',
      date: '2020-06-28',
    },
    headers: {
      'x-rapidapi-host': 'covid-19-statistics.p.rapidapi.com',
      'x-rapidapi-key': 'ed695d1127mshcb85b847f3a808fp131680jsn702c0339b102',
      useQueryString: true
    }
  };

  var totalData = {
    method: 'GET',
    url: 'https://covid-19-statistics.p.rapidapi.com/reports/total',
    qs: {date: '2020-04-07'},
    headers: {
      'x-rapidapi-host': 'covid-19-statistics.p.rapidapi.com',
      'x-rapidapi-key': 'ed695d1127mshcb85b847f3a808fp131680jsn702c0339b102',
      useQueryString: true
    }
  };
/*          let worldDatas = []
            request(totalData, function (error, response, body) {
                if (error) throw new Error(error);
                const worldData = (JSON.parse(body));
                const total_in_world = worldData.data.confirmed
                const total_death_in_world = worldData.data.deaths
                worldDatas.push({
                    total_in_world,total_death_in_world
                })
            });
*/
module.exports = (app) => {

    app.post('/WorldData', (req,res) => {
        let worldDatas = []
            request(totalData, function (error, response, body) {
                if (error) throw new Error(error);
                const worldData = (JSON.parse(body));
                const total_in_world = worldData.data.confirmed
                const total_death_in_world = worldData.data.deaths
                worldDatas.push({
                    total_in_world,total_death_in_world
                })
                console.log(worldDatas)
                res.send(worldDatas)
            });
    })
    
    // request from covid api depending on country
    app.post('/searchData', 
    async function(req, res) { 
        try {// request for daily usa data
            const region =  req.body.region_province
            const city = req.body.city_name
            if (region == "" || city == "") {
                return res.send({
                    error: 'Incorrect state or city'
            })
        }
            dailyUSAData.qs.region_province = region
            dailyUSAData.qs.city_name = city
            
            await request(dailyUSAData, function (error, response, body) {
                
                if (error) throw new Error(error);
                let jsonbody = JSON.parse(body)
                if (jsonbody.data.length == 0) {
                    return res.send({
                        error: 'Incorrect state or city'
                    })
                } else {
                    let data = []
                    for (let i = 0; i < jsonbody.data.length; i++) {
                        
                        const city = jsonbody.data[i].region.cities[0].name
                        const state = jsonbody.data[i].region.province
                        const total_confirmed_in_state = jsonbody.data[i].confirmed
                        const total_death = jsonbody.data[i].deaths
                        const today_confirmed_in_city = jsonbody.data[i].region.cities[0].confirmed
                        const death_in_city = jsonbody.data[i].region.cities[0].deaths
                        const last_update = jsonbody.data[i].region.cities[0].last_update
                        data.push({
                            state, city ,total_confirmed_in_state, today_confirmed_in_city, total_death, death_in_city, last_update
                        })
                    }
                    console.log(jsonbody)
                    return res.send(data)
                }
            });
        }   catch (err) {
                return res.status(500).send({
                error: 'An error has occured trying to parse'
                })
        }
    })
    
    // scraping title and ratings of all movies within an array.
    app.post('/scrape', 
    async function(req, res) {
        try {
            const body = req.body
            // await will make sure function is ran before going linearly down.
            const titles = await functions.getTitles(body.text)
            const text = body.text
            console.log("this is working: " + text)
            //const urls = Array.from(getUrls(text));
            
            if (!body || text === "" || titles.length == 0) { //no text provided.
                return res.send({
                    error: "please provide valid urls"
                })
            } else {
            (async function () {
                let imdbData = []
                for (let movie of titles) {
                const response = await request({
                uri: movie,
                json: true
                })
                let $ = cheerio.load(response)
                const title = $('div[class="title_wrapper"] > h1').text().trim()
                var rating = $('div[class="ratingValue"] > strong').text()
                if (rating === "") {
                    rating = "unrated"
                }
                imdbData.push({
                title, rating
                })
            }
                res.send(imdbData)
                console.log(imdbData)
                return {
                    title: imdbData.title,
                    rating: imdbData.rating
                }
            }
            )()
        }
    }
        catch (err) {
            res.status(500).send({
            error: 'An error has occured trying to parse'
        })
    }
      });


}