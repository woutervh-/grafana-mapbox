import React from 'react';
import { DataFrame, dateTime, PanelData } from '@grafana/data';
import { MapboxPanelOptions } from 'types';
import wkx from 'wkx';
import * as constants from './constants';

export const useAvailableTimeValues = (options: MapboxPanelOptions, data: PanelData) => {
  return React.useMemo(
    () => {
      if (data.series.length <= 0) {
        return;
      }
      const series = data.series[0];
      const timeField = series.fields.find((field) => field.name === options['time-column-name']);
      if (!timeField) {
        return;
      }
      const times = new Set<number>();
      const timeValues = timeField.values.toArray();
      for (const timeValue of timeValues) {
        times.add(timeValue);
      }
      return Array.from(times);
    },
    [options, data]
  );
};

export const useEffectiveTimeValue = (options: MapboxPanelOptions, data: PanelData, availableTimeValues: number[] | undefined, selectedSnapshotTime: number[] | null, selectedTimeRange: number[] | null) => {
  return React.useMemo(
    (): number[] | undefined => {
      if (options['time-option'] === 'snapshots') {
        if (data.series.length <= 0) {
          return;
        }
        if (!availableTimeValues) {
          return;
        }
        if (selectedSnapshotTime && availableTimeValues.includes(selectedSnapshotTime[0])) {
          return selectedSnapshotTime;
        } else {
          return [availableTimeValues[0]];
        }
      } else if (options['time-option'] === 'time-range') {
        if (selectedTimeRange && data.timeRange.from.valueOf() <= selectedTimeRange[0] && selectedTimeRange[1] <= data.timeRange.to.valueOf()) {
          return selectedTimeRange;
        } else {
          return [data.timeRange.from.valueOf(), data.timeRange.to.valueOf()];
        }
      } else {
        return;
      }
    },
    [options, data, availableTimeValues, selectedSnapshotTime, selectedTimeRange]
  );
};

export const useWktGeometries = (options: MapboxPanelOptions, series: DataFrame, indexFilter: (index: number) => boolean) => {
  const wktField = series.fields.find((field) => field.name === options['wkt-column-name']);
  if (!wktField) {
    return;
  }
  const wktValues = wktField.values.toArray();
  const geometries: GeoJSON.Geometry[] = [];
  for (let i = 0; i < series.length; i++) {
    if (!indexFilter(i)) {
      continue;
    }
    const wkt = wktValues[i];
    const geometry = wkx.Geometry.parse(wkt).toGeoJSON() as GeoJSON.Geometry;
    geometries.push(geometry);
  }
  return geometries;
};

export const useGeoCoordinateGeometries = (options: MapboxPanelOptions, series: DataFrame, indexFilter: (index: number) => boolean) => {
  const latitudeField = series.fields.find((field) => field.name === options['latitude-column-name']);
  const longitudeField = series.fields.find((field) => field.name === options['longitude-column-name']);
  if (!latitudeField || !longitudeField) {
    return;
  }
  const latitudeValues = latitudeField.values.toArray();
  const longitudeValues = longitudeField.values.toArray();
  const geometries: GeoJSON.Geometry[] = [];
  for (let i = 0; i < series.length; i++) {
    if (!indexFilter(i)) {
      continue;
    }
    const latitude = latitudeValues[i];
    const longitude = longitudeValues[i];
    const geometry: GeoJSON.Geometry = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
    geometries.push(geometry);
  }
  return geometries;
};

export const useSelectedFeatures = (options: MapboxPanelOptions, data: PanelData, effectiveTimeValue: number[] | undefined) => {
  return React.useMemo(
    () => {
      if (data.series.length <= 0 || !effectiveTimeValue) {
        return;
      }
      const series = data.series[0];
      const timeField = series.fields.find((field) => field.name === options['time-column-name']);
      if (!timeField) {
        return;
      }
      const timeValues = timeField.values.toArray();

      const indexFilter = effectiveTimeValue.length === 1
        ? (index: number) => {
          return timeValues[index] === effectiveTimeValue[0];
        }
        : (index: number) => {
          return effectiveTimeValue[0] <= timeValues[index] && timeValues[index] <= effectiveTimeValue[1];
        };

      let geometries: GeoJSON.Geometry[] | undefined = undefined;
      switch (options.selection) {
        case 'wkt':
          geometries = useWktGeometries(options, series, indexFilter);
          break;
        case 'geo-coordinate':
          geometries = useGeoCoordinateGeometries(options, series, indexFilter);
          break;
      }

      if (!geometries) {
        return;
      }

      const propertyFields = series.fields.filter((field) => field.name !== options['time-column-name']);
      const propertyValues: { [Key: string]: any[] } = {};
      for (const field of propertyFields) {
        propertyValues[field.name] = field.values.toArray();
      }

      const features: GeoJSON.Feature[] = [];
      for (let i = 0, j = 0; i < series.length; i++) {
        if (!indexFilter(i)) {
          continue;
        }
        const properties: { [Key: string]: any } = {};
        properties[options['time-column-name']] = dateTime(timeValues[i]).format();
        for (const field of propertyFields) {
          const value = propertyValues[field.name][i];
          properties[field.name] = value;
        }
        features.push({
          type: 'Feature',
          geometry: geometries[j],
          properties
        });
        j += 1;
      }
      return features;
    },
    [effectiveTimeValue, data]
  );
};

export const useMapboxData = (options: MapboxPanelOptions, selectedFeatures: GeoJSON.Feature[] | undefined) => {
  return React.useMemo(
    () => {
      if (!selectedFeatures) {
        return;
      }
      const source: mapboxgl.GeoJSONSourceRaw = {
        type: 'geojson',
        tolerance: 0,
        data: {
          type: 'FeatureCollection',
          features: selectedFeatures
        }
      };
      const layers: mapboxgl.Layer[] = [];
      if (options['show-lines']) {
        layers.push({
          id: constants.lineLayerId,
          source: constants.dataSourceId,
          type: 'line',
          minzoom: 0,
          maxzoom: 24,
          metadata: {
            'app:clickable': true
          },
          paint: {
            'line-width': 3,
            'line-color': 'red'
          }
        });
      }
      if (options['show-circles']) {
        layers.push({
          id: constants.circleLayerId,
          source: constants.dataSourceId,
          type: 'circle',
          minzoom: 0,
          maxzoom: 24,
          metadata: {
            'app:clickable': true
          },
          paint: {
            'circle-radius': 3,
            'circle-color': 'red'
          }
        });
      }
      return { source, layers };
    },
    [selectedFeatures, options]
  );
};
