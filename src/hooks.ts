import React from 'react';
import { DataFrame, dateTime, PanelData } from '@grafana/data';
import { MapboxPanelOptions } from 'types';
import wkx from 'wkx';

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

export const useEffectiveTimeValue = (data: PanelData, availableTimeValues: number[] | undefined, selectedTimeValue: number | null) => {
  return React.useMemo(
    () => {
      if (data.series.length <= 0) {
        return;
      }
      if (!availableTimeValues) {
        return;
      }
      if (selectedTimeValue && availableTimeValues.includes(selectedTimeValue)) {
        return selectedTimeValue;
      } else {
        return availableTimeValues[0];
      }
    },
    [data, availableTimeValues, selectedTimeValue]
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

export const useSelectedFeatures = (options: MapboxPanelOptions, data: PanelData, effectiveTimeValue: number | undefined) => {
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
      const timeValues = timeField.values.toArray();

      const indexFilter = (index: number) => {
        return timeValues[index] === effectiveTimeValue;
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
