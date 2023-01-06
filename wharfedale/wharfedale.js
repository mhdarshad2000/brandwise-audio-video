const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/wharfedale/wharfedale-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const wharfedale = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(10),div:nth-child(11)").children("ul").map((i, state) => {
                wharfedale[i] = {}
                wharfedale[i]['state'] = ($(state).children("strong").text())
                wharfedale[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    wharfedale[i]['states'][j] = {}
                    wharfedale[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    wharfedale[i]['states'][j]['link'] = link

                    wharfedale[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(wharfedale)
                fs.writeFileSync("./wharfedale/wharfedale.json", brand)

            }, 20000)

        } catch (error) {
            console.log(error.message)
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

            $(postDiv).find("dl").each((i,serviceCenter)=>{
                arr[i]={}
                arr[i]["serviceCenter"] = $(serviceCenter).children("dt").text()
                let address = []
                let phone = []
                $(serviceCenter).children("dd").each((j,temp)=>{
                    if(/[a-z]/gi.test($(temp).text())){
                        address.push($(temp).text())
                    }else{
                        phone.push($(temp).text())
                    }
                })
                arr[i]["address"] = address.join("")
                arr[i]["phone"] = phone.join("")
            })

            
          
            resolve(arr)
        } catch (error) {
            console.error(error)
        }
    })
}