import { StyleSheet, View } from "react-native";
import { SFSymbol } from "expo-symbols";

import { useThemeColors } from "../theme/colors";
import type { DestinationCategory } from "../utils/destinationCategory.mapper";
import { AdaptiveIcon } from "./AdaptiveIcon";

type IconMapping = { fallback: string; ios: SFSymbol };

const icons: Record<DestinationCategory, IconMapping> = {
  health: { fallback: "hospital-building", ios: "cross.case" },
  pharmacy: { fallback: "medical-bag", ios: "cross.vial" },
  market: { fallback: "cart-outline", ios: "cart" },
  bakery: { fallback: "bread-slice-outline", ios: "cup.and.saucer" },
  food: { fallback: "silverware-fork-knife", ios: "fork.knife" },
  education: { fallback: "school-outline", ios: "graduationcap" },
  bus_terminal: { fallback: "bus-stop-covered", ios: "bus" },
  bus_stop: { fallback: "bus-stop", ios: "bus" },
  address: { fallback: "map-marker-outline", ios: "mappin" },
  residence: { fallback: "home-variant-outline", ios: "house" },
  residential_building: { fallback: "office-building-outline", ios: "building.2" },
  lodging: { fallback: "bed-outline", ios: "bed.double" },
  commerce: { fallback: "storefront-outline", ios: "bag" },
  fuel: { fallback: "gas-station-outline", ios: "fuelpump" },
  bank: { fallback: "bank-outline", ios: "building.columns" },
  religious: { fallback: "church-outline", ios: "building.columns" },
  park: { fallback: "tree-outline", ios: "tree" },
  gym: { fallback: "dumbbell", ios: "dumbbell" },
  police: { fallback: "shield-account-outline", ios: "shield" },
  government: { fallback: "city-variant-outline", ios: "building.columns" },
  station: { fallback: "train", ios: "train.side.front.car" },
  airport: { fallback: "airplane", ios: "airplane" },
  unknown: { fallback: "map-marker-outline", ios: "mappin" },
};

export function DestinationCategoryIcon({ category, size = "medium" }: { category: DestinationCategory; size?: "medium" | "small" }) {
  const theme = useThemeColors();
  const iconSize = size === "small" ? 20 : 22;
  const mapping = icons[category] || icons.unknown;
  
  return (
    <View style={[styles.container, size === "small" && styles.small, { backgroundColor: theme.primaryLight }]} accessibilityElementsHidden>
      <AdaptiveIcon iosSymbol={mapping.ios} fallbackFamily="MaterialCommunityIcons" fallbackName={mapping.fallback} size={iconSize} color={theme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  small: { width: 44, height: 44, borderRadius: 13 },
});
