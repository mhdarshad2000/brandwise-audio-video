const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/vizio-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const vizio = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(10),div:nth-child(11)").children("ul").map((i, state) => {
                vizio[i] = {}
                vizio[i]['state'] = ($(state).children("strong").text())
                vizio[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    vizio[i]['states'][j] = {}
                    vizio[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    vizio[i]['states'][j]['link'] = link

                    vizio[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(vizio)
                fs.writeFileSync("./vizio/vizio.json", brand)

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

            $(postDiv).find("#results-list > div").each((i,serviceCenter)=>{
                arr[i]={}
                const serviceCenterName = $(serviceCenter).text().split(".")[1]?.split(/[0-9]/g)[0].replace(/(\r\n|\n|\r|\t)/gm, "").trim()
                arr[i]["serviceCenter"] = serviceCenterName
                address = $(serviceCenter).text().replace(serviceCenterName,"").split("\n")
                let phone = []
                address.map((elem,index)=>{
                    if(!/[a-z]/gi.test(elem)){
                        phone.push(elem)
                        address[index] = ""
                    }
                })
                arr[i]["address"] = address.join("").replaceAll("           "," ").trim()
                arr[i]["phone"] = phone.join("").split(".")[1].trim()
            })
          
            resolve(arr)
        } catch (error) {
            console.error(error)
        }
    })
}