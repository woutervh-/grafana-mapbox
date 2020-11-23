import React from 'react';
import { dateTime, GrafanaTheme, PanelProps } from '@grafana/data';
import { MapboxPanelOptions } from 'types';
import { css, cx } from 'emotion';
import { Label, stylesFactory, useTheme } from '@grafana/ui';
import { MapComponent } from './map/map-component';
import { TimeSlider } from './TimeSlider';
import * as hooks from './hooks';
import { Popup } from './map/mapbox/popup';
import * as constants from './constants';

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

  const [selectedSnapshotTime, setSelectedSnapshotTime] = React.useState<number[] | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = React.useState<number[] | null>(null);
  const [mapInstance, setMapInstance] = React.useState<mapboxgl.Map | null>(null);
  const [popupInfo, setPopupInfo] = React.useState<PopupInfo | null>(null);

  const availableTimeValues = hooks.useAvailableTimeValues(options, data);
  const effectiveTimeValue = hooks.useEffectiveTimeValue(options, data, availableTimeValues, selectedSnapshotTime, selectedTimeRange);
  const selectedFeatures = hooks.useSelectedFeatures(options, data, effectiveTimeValue);
  const mapboxData = hooks.useMapboxData(options, selectedFeatures);

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
          if (layers.find((layer) => layer.id === constants.lineLayerId)) {
            mapInstance.removeLayer(constants.lineLayerId);
          }
          if (layers.find((layer) => layer.id === constants.circleLayerId)) {
            mapInstance.removeLayer(constants.circleLayerId);
          }
        }
        const sources = mapInstance.getStyle().sources;
        if (sources && constants.dataSourceId in sources) {
          mapInstance.removeSource(constants.dataSourceId);
        }
      } catch {
        // Ignore.
      }
      if (!mapboxData) {
        return;
      }
      mapInstance.addSource(constants.dataSourceId, mapboxData.source);
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
      {
        options['time-option'] === 'time-range'
          ? <TimeSlider min={data.timeRange.from} max={data.timeRange.to} mode="range" onChange={setSelectedTimeRange} />
          : <TimeSlider min={data.timeRange.from} max={data.timeRange.to} mode="snapshot" onChange={setSelectedSnapshotTime} timeValues={availableTimeValues} />
      }
      <Label>
        {
          options['time-option'] === 'time-range'
            ? 'Time range: '
            : 'Snapshot time: '
        }
        {
          effectiveTimeValue
            ? effectiveTimeValue.map((t) => dateTime(t).fromNow()).join(' - ')
            : 'unselected'
        }
      </Label>
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
