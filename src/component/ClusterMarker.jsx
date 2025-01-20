import { useCallback } from "react";
import { Marker } from "react-leaflet";
import { useMap } from "react-leaflet/hooks";

const ClusterMarker = ({ cluster, createClusterIcon, clusterRef }) => {
  const map = useMap();

  const handleClick = useCallback(() => {
    if (!clusterRef.current) {
      console.error("Supercluster is not initialized");
      return;
    }

    const expansionZoom = clusterRef.current.getClusterExpansionZoom(
      cluster.id
    );
    const desiredZoom = Math.min(expansionZoom, 22);

    if (desiredZoom > map.getZoom()) {
      map.flyTo(
        [cluster.geometry.coordinates[1], cluster.geometry.coordinates[0]],
        desiredZoom,
        {
          duration: 0.5,
        }
      );
    } else {
      console.warn(
        `Cannot zoom beyond maxZoom or expansionZoom is not greater than current zoom: ${expansionZoom}`
      );
    }
  }, [cluster, map, clusterRef]);

  return (
    <Marker
      position={[
        cluster.geometry.coordinates[1],
        cluster.geometry.coordinates[0],
      ]}
      eventHandlers={{
        click: handleClick,
      }}
      icon={createClusterIcon(cluster.properties.point_count)}
    ></Marker>
  );
};

export default ClusterMarker;
