# doxy-twitterbot
A twitter bot with a variety of functions. One of the main functions is posting images to twitter at set intervals.

## bot.js
This file contains all the Twitter related functionality and a reference to the MediaFetcher object used to retreive images/gifs from a root directory and post them at scheduled intervals on twitter.

## media-fetcher.js
This file retreives info about objects from a specified root directory structured as shown below and reloads that information at scheduled intervals. It is used by the bot to return a random media item to be tweeted.
Directory structure should be as follows:
```
/
  tag/
    -image1.jpg
    -image2.jpg
  tag2/
    -image3.jpg
```

The MediaItem object that is returned from the `randomMedia()` function is as follows:
```
{
  name:string,
  parent:string,
  tags: string[],
  path: string
}
```
