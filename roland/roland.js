const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/roland/roland-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const roland = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                    roland[i] = {}
                    roland[i]['state'] = ($(state).children("strong").text())
                    roland[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        roland[i]['states'][j] = {}
                        roland[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        roland[i]['states'][j]['link'] = link

                        roland[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(roland)
                    fs.writeFileSync("./roland/roland.json", brand)
                }, 20000)
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

            let count = 0
            $(postDiv).children("p").each((i, serviceCenter) => {
                if ($(serviceCenter).children("strong").length === 1 &&
                    ! $(serviceCenter).children("strong").text().includes("Zip") &&
                    ! $(serviceCenter).children("strong").text().includes("Support for Roland products") 
                    
                ) {
                    arr[count] = {}
                    const serviceCenterName = $(serviceCenter).children("strong").text()
                    arr[count]["serviceCenter"] = serviceCenterName
                    const address = $(serviceCenter).text().replace(serviceCenterName,"").replaceAll("\t","").split("\n")
                    let phone = []
                    address.map((elem,index)=>{
                        if(!/[a-z]/gi.test(elem)){
                            phone.push(elem)
                            address[index] = ""
                        }
                    })
                    arr[count]["address"] = address.join("  ").trim()
                    arr[count]["phone"] = phone.join().replaceAll(",","").trim()
                    count++
                }
            })
            if(!arr.length){
                $(postDiv).children("strong").each((i,serviceCenter)=>{
                    arr[i]={}
                    const serviceCenterName = $(serviceCenter).text()
                    arr[i]["serviceCenter"] = serviceCenterName 
                    const address = $(postDiv).text().split(serviceCenterName)[1].split("Support for Roland")[0].split("\n")
                    let phone = []
                    address.map((elem,index)=>{
                        if(!/[a-z]/gi.test(elem)){
                            phone.push(elem)
                            address[index] = ""
                        }
                    })

                    arr[i]["address"] = address.join("  ").replaceAll("\t","").trim()
                    arr[i]["phone"] = phone.join("").trim()
                })
            }

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}