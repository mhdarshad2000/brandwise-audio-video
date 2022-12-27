const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/denon/denon-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const denon = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                    denon[i] = {}
                    denon[i]['state'] = ($(state).children("strong").text())
                    denon[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        denon[i]['states'][j] = {}
                        denon[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        denon[i]['states'][j]['link'] = link

                        denon[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(denon)
                    fs.writeFileSync("./denon/denon.json", brand)
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

            let count =0
            $(postDiv).children("p").each((i,serviceCenter)=>{
                if($(serviceCenter).children("strong").length === 1&&
                !$(serviceCenter).children("strong").text().includes("Denon Support Products:")&&
                !$(serviceCenter).children("strong").text().includes("Denon Contact Customer Service")&&
                !$(serviceCenter).children("strong").text().includes("Zip Code") ){
                    arr[count] = {}
                    const serviceCenterName = $(serviceCenter).children("strong").text()
                    if(serviceCenterName.includes("Tel.")){
                        arr[count]["serviceCenter"] = serviceCenterName.split("\n")[0].trim()
                        arr[count]["address"] = serviceCenterName.replace(serviceCenterName.split("\n"),"").split("Tel.:")[0].replaceAll("\n","").replaceAll("\t","").trim()
                        arr[count]["phone"] = serviceCenterName.split("Tel.:")[1].trim()
                    }else{
                        arr[count]["serviceCenter"] = serviceCenterName
                        const address = $(serviceCenter).text().replace(serviceCenterName,"")
                        arr[count]["address"] = address?.split("Tel.")[0].replaceAll("\t","").replaceAll("\n"," ").trim()
                        arr[count]["phone"] = address?.split("Tel.:")[1]?.split("\n")[0]?.trim()
                        arr[count]["fax"] = address?.split("Fax:")[1]?.split("\n")[0]?.trim()
                    }

                    count ++
                }
            })

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}