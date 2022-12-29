const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/onkyo/onkyo-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const onkyo = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                    onkyo[i] = {}
                    onkyo[i]['state'] = ($(state).children("strong").text())
                    onkyo[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        onkyo[i]['states'][j] = {}
                        onkyo[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        onkyo[i]['states'][j]['link'] = link

                        onkyo[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(onkyo)
                    fs.writeFileSync("./onkyo/onkyo.json", brand)
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

            let count =0
            $(postDiv).children("p").each((i,serviceCenter)=>{
                if($(serviceCenter).text()?.includes("Distance:")){
                    arr[count]={}
                    const string = $(serviceCenter).text().split("Distance:")[0].split("\n")
                    arr[count]["serviceCenter"] = string[0].trim()
                    let phone = []
                    string.map((elem,index)=>{
                        if(elem.includes("Tel")){
                            phone.push(elem)
                        }
                    })
                    arr[count]["address"] = string.join().replace(string[0],"")?.replace(phone.join(),"").replaceAll(",","").replaceAll("\t","")?.split("www.")[0].trim()
                    arr[count]["phone"] = phone.join().replace("\t","").split("(")[0]?.trim()
                    count ++
                }
            })

            if(!arr.length){
                let count = 0
                $(postDiv).children("p").each((i,serviceCenter)=>{
                    if($(serviceCenter).children("strong").length === 1 &&
                    !$(serviceCenter).children("strong").text().includes("Support for Onkyo products") &&
                    !$(serviceCenter).children("strong").text().includes("Onkyo Support Products:") &&
                    !$(serviceCenter).children("strong").text().includes("Zip Code")
                    ){
                        arr[count] = {}
                        const serviceCenterName = $(serviceCenter).children("strong").text()
                        arr[count]["serviceCenter"] = serviceCenterName
                        const string = $(serviceCenter).text().replace(serviceCenterName,"")
                        arr[count]["address"] = string?.split("Phone:")[0]?.split("WebSite")[0]?.split("View Map")[0]?.replaceAll("\t","")?.replaceAll('"\"',"")?.replaceAll("\n"," ")?.trim()
                        arr[count]["phone"] = string?.split("Phone:")[1]?.split("\n")[0]?.trim()
                        count ++
                    }
                })
            }
            if(!arr.length){
                let count = 0
                $(postDiv).children("p").each((i,serviceCenter)=>{
                    if($(serviceCenter).text()?.includes("View Map")){
                        arr[count]={}
                        const serviceCenterName = $(serviceCenter).text().split("\n")[0]
                        arr[count]["serviceCenter"] = serviceCenterName
                        arr[count]["address"] = $(serviceCenter).text().replace(serviceCenterName,"")?.split("Phone:")[0]?.replaceAll("\n"," ")?.replaceAll("\t","")?.trim()
                        arr[count]["phone"] = $(serviceCenter).text()?.split("Phone:")[1]?.split("\n")[0]?.trim()
                        count ++
                    }
                })
            }


            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}