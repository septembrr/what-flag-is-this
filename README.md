# What Flag is This? App
A quiz game asking users to guess from which country a particular flag comes.

![homepage of what flag is this app](https://raw.githubusercontent.com/septembrr/what-flag-is-this/main/public/img/homepage.png)

## Image Scraper Microservice
This app provides a microservice that scrapes images from Wikipedia pages. Based on the provided parameters, the service will return an applicable image.

To use the microservice, make a GET request to the '<root url>/image' with the following parameters:
```
{
    keyword: string
    size [optional]: string (of the form "400px") [default: "500px"]
    alt_search_term [optional]: string
}
```

`size` indicates the width of the image returned. If a width is provided that is larger than the dimensions of the image, the largest size available will be returned.

If no `alt_search_term` is provided, the microservice will return the first image it finds on the page.

If `alt_search_term` is provided, the microservice will search through all of the images found on the page until either one is found whose alt text contains the search term (case insensitive), or all of the images have been reviewed. If the search term is not found, the microservice will return the first image on the page.

The scraper returns an object of the following form:
```
{
    image: string (base64 image)
    alt: string (alt text of image)
}
```

## Other Microservices
This app also uses a text scraping service to show data about the country to the user.
