# Mapbox Panel plugin

## Introduction

Let's consider a time-series with geospatial data, for example:

| datetime            | latitude | longitude |
|---------------------|----------|-----------|
| 2020-11-23 13:27:02 | 52.375   | 4.89865   |
| 2020-11-23 13:27:02 | 52.3725  | 4.90977   |
| 2020-11-23 13:27:02 | 52.3193  | 5.13439   |
| 2020-11-23 13:27:02 | 52.4427  | 5.54845   |
| 2020-11-23 13:27:02 | 50.7302  | 2.4198    |
| 2020-11-23 15:12:49 | 47.0571  | 15.4308   |
| 2020-11-23 15:12:49 | 47.1479  | 15.7725   |
| 2020-11-23 15:12:49 | 46.7176  | 15.6473   |
| 2020-11-23 15:12:49 | 47.2397  | 18.8275   |

Querying this data from Grafana together with this plugin will allow you to dynamically display parts of this data on a Mapbox map:

![Demo](https://github.com/woutervh-/grafana-mapbox/raw/master/docs/demo.gif)

## Future ideas

- Custom styling.
- Mapbox Studio API key + style integration.
