import React from 'react';
import { dateTime, GrafanaTheme, PanelProps } from '@grafana/data';
import { MapboxPanelOptions } from 'types';
import { css, cx } from 'emotion';
import { Label, stylesFactory, useTheme } from '@grafana/ui';
import { MapComponent } from './map/map-component';
import { TimeSlider } from './TimeSlider';
import wkx from 'wkx';
import { Popup } from './map/mapbox/popup';

let popupKey = 0;

interface PopupInfo {
  key: number;
  map: mapboxgl.Map;
  selectedFeature: GeoJSON.Feature;
  lngLat: mapboxgl.LngLat;
}

interface Props extends PanelProps<MapboxPanelOptions> { }

export const MapboxPanel: React.FC<Props> = ({ options, data, width, height }) => {
  const theme = useTheme();
  const styles = getStyles(theme);

  const [selectedTimeValue, setSelectedTimeValue] = React.useState<number | null>(null);
  const [mapInstance, setMapInstance] = React.useState<mapboxgl.Map | null>(null);
  const [popupInfo, setPopupInfo] = React.useState<PopupInfo | null>(null);

  const availableTimeValues = React.useMemo(
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

  const actualTimeValue = React.useMemo(
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

  const selectedFeatures = React.useMemo(
    () => {
      if (data.series.length <= 0) {
        return;
      }
      const series = data.series[0];
      const timeField = series.fields.find((field) => field.name === options['time-column-name']);
      const wktField = series.fields.find((field) => field.name === options['wkt-column-name']);
      if (!timeField || !wktField) {
        return;
      }

      const propertyFields = series.fields.filter((field) => field.name !== options['time-column-name'] && field.name !== options['wkt-column-name']);
      const propertyValues: { [Key: string]: any[] } = {};
      for (const field of propertyFields) {
        propertyValues[field.name] = field.values.toArray();
      }

      const timeValues: number[] = timeField.values.toArray();
      const wktValues: string[] = wktField.values.toArray();
      const features: { wkt: string, properties: {} }[] = [];
      for (let i = 0; i < series.length; i++) {
        if (timeValues[i] !== actualTimeValue) {
          continue;
        }
        const properties: { [Key: string]: any } = {};
        properties[options['time-column-name']] = dateTime(timeValues[i]).format();
        properties[options['wkt-column-name']] = wktValues[i];
        for (const field of propertyFields) {
          const value = propertyValues[field.name][i];
          properties[field.name] = value;
        }
        features.push({ wkt: wktValues[i], properties });
      }
      return features;
    },
    [actualTimeValue, data]
  );

  const mapboxData = React.useMemo(
    () => {
      if (!selectedFeatures) {
        return;
      }
      const source: mapboxgl.GeoJSONSourceRaw = {
        type: 'geojson',
        tolerance: 0,
        data: {
          type: 'FeatureCollection',
          features: selectedFeatures.map((feature) => {
            const geometry = wkx.Geometry.parse(feature.wkt).toGeoJSON() as GeoJSON.Geometry;
            return {
              type: 'Feature',
              geometry: geometry,
              properties: feature.properties
            };
          })
        }
      };
      const layers: mapboxgl.Layer[] = [];
      if (options['show-lines']) {
        layers.push({
          id: 'wkt-data-line',
          source: 'wkt-data',
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
          id: 'wkt-data-circle',
          source: 'wkt-data',
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

  const handleMouseEnter = React.useCallback(
    (event: mapboxgl.MapLayerMouseEvent) => {
      event.target.getCanvas().style.cursor = 'pointer';
    },
    []
  );

  const handleMouseLeave = React.useCallback(
    (event: mapboxgl.MapLayerMouseEvent) => {
      event.target.getCanvas().style.cursor = '';
    },
    []
  );

  const handleClick = React.useCallback(
    (event: mapboxgl.MapLayerMouseEvent) => {
      if (event.features) {
        setPopupInfo({ key: popupKey++, lngLat: event.lngLat, map: event.target, selectedFeature: event.features[0] });
      } else {
        setPopupInfo(null);
      }
    },
    []
  );

  React.useEffect(
    () => {
      if (!mapInstance) {
        return;
      }
      try {
        const layers = mapInstance.getStyle().layers;
        if (layers) {
          if (layers.find((layer) => layer.id === 'wkt-data-line')) {
            mapInstance.removeLayer('wkt-data-line');
          }
          if (layers.find((layer) => layer.id === 'wkt-data-circle')) {
            mapInstance.removeLayer('wkt-data-circle');
          }
        }
        const sources = mapInstance.getStyle().sources;
        if (sources && 'wkt-data' in sources) {
          mapInstance.removeSource('wkt-data');
        }
      } catch {
        // Ignore.
      }
      if (!mapboxData) {
        return;
      }
      mapInstance.addSource('wkt-data', mapboxData.source);
      for (const layer of mapboxData.layers) {
        mapInstance.addLayer(layer);
        mapInstance.on('mouseenter', layer.id, handleMouseEnter);
        mapInstance.on('mouseleave', layer.id, handleMouseLeave);
        mapInstance.on('click', layer.id, handleClick);
      }
    },
    [mapboxData, mapInstance]
  );

  return (
    <div
      className={cx(
        styles.wrapper,
        css`
            width: ${width}px;
            height: ${height}px;
          `
      )}
    >
      <MapComponent width={width} height={height - 67} styleUrl={options['style-url']} onMapReference={setMapInstance} />
      <TimeSlider min={data.timeRange.from} max={data.timeRange.to} timeValues={availableTimeValues} onChange={setSelectedTimeValue} />
      <Label>{dateTime(actualTimeValue).fromNow()}</Label>
      {
        popupInfo
          ? <Popup key={popupInfo.key} map={popupInfo.map} lngLat={popupInfo.lngLat} className={styles.popup}>
            <div className={cx(styles.popupContent)}>
              {
                popupInfo.selectedFeature.properties && Object.keys(popupInfo.selectedFeature.properties).length >= 1
                  ? <div className={cx(styles.popupProperties)}>
                    {Object.keys(popupInfo.selectedFeature.properties)
                      .map((key) => {
                        return <React.Fragment key={key}>
                          <strong>{key}</strong>
                          <pre className={styles.popupProperty}>{JSON.stringify(popupInfo.selectedFeature.properties![key])}</pre>
                        </React.Fragment>;
                      })
                    }
                  </div>
                  : <div>No properties.</div>
              }
            </div>
          </Popup>
          : null
      }
    </div>
  );
};

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    wrapper: css`
      position: relative;
    `,
    popup: css`
    --mapbox-popup-background-color: ${theme.colors.bg1};
    `,
    popupContent: css`
      background-color: ${theme.colors.bg1};
      color: ${theme.colors.text};
    `,
    popupProperties: css`
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 10px;
      overflow: auto;
    `,
    popupProperty: css`
      margin: 0;
      padding: 0;
    `
  };
});
