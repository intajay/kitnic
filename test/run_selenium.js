const webdriver = require('selenium-webdriver')

const branch    = process.env.TRAVIS_BRANCH
const username  = process.env.SAUCE_USER_NAME
const accessKey = process.env.SAUCE_ACCESS_KEY

const chrome_versions = ['50', '52', '53', '54', '55', 'latest']

const promises = chrome_versions.map(version => {
  return new Promise((resolve, reject) => {
    const driver = new webdriver.Builder()
    .withCapabilities({
        browserName: 'chrome',
        platform: 'Windows 10',
        version,
        username,
        accessKey
    })
    .usingServer(`https://${username}:${accessKey}@ondemand.saucelabs.com/wd/hub`)
    .build()
    resolve(driver)
  }).then(driver => {
    let url = `http://${branch}.preview.kitnic.it/`
    if (branch === 'master') {
        url = 'https://kitnic.it'
    }

    driver.get(url)

    driver.getTitle().then(function (title) {
        console.log("title is: " + title)
    })

    driver.quit()
  })
})

Promise.all(promises).catch(err => {
    console.error(err)
    throw err
})