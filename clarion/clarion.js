const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/clarion/clarion-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const clarion = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                    clarion[i] = {}
                    clarion[i]['state'] = ($(state).children("strong").text())
                    clarion[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        clarion[i]['states'][j] = {}
                        clarion[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        clarion[i]['states'][j]['link'] = link

                        clarion[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(clarion)
                    fs.writeFileSync("./clarion/clarion.json", brand)
                }, 8000)
            })

        } catch (error) {
            console.log(error.message, 404)
        }
    })
}

scrap()

async function detailsPage(cityUrl, brand) {
    return new Promise(async (resolve) => {
        try {
            const arr = []
            const htmlString = await rp(cityUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")

            const tableDiv = $(postDiv).find("table > tbody > tr")

            if( $(tableDiv).text()){
                $(tableDiv).each((i,serviceCenter)=>{
                    arr[i]={}
                    const string = $(serviceCenter).children("td").text().replaceAll("\t","").replaceAll("  ","").split("\n")
                    
                    arr[i]["serviceCenter"] =string[0]

                    let phone = []
                    string.map((elem,index)=>{
                        if(index === 0){
                            string[index] = ""
                        }else if(!/[a-z]/gi.test(elem)){
                            phone.push(elem)
                            string[index]=""
                        }
                    })
                    arr[i]["address"] = string.join().replaceAll(",","  ").trim()
                    arr[i]["phone"] = phone.join().replaceAll(","," ").trim()
                })
            }

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}