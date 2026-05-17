import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { listItems, imageUrl } from "../api/items";
import type { Item, ItemType } from "../types";
import type { RootStackParamList } from "../../App";
import { colors, radius, shadow } from "../theme";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Home">;
};

const TYPES: { label: string; value: ItemType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Lost", value: "lost" },
  { label: "Found", value: "found" },
];

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function ItemCard({ item, onPress }: { item: Item; onPress: () => void }) {
  const date = item.type === "lost" ? item.last_seen_date : item.found_date;
  const locationText =
    item.type === "lost"
      ? item.last_seen_location_text
      : item.found_location_text;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrap}>
        {item.image_id ? (
          <Image
            source={{ uri: imageUrl(item.image_id) }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderLetter}>
              {item.category[0] ?? "?"}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.badge,
            item.type === "lost" ? styles.badgeLost : styles.badgeFound,
          ]}
        >
          <Text style={styles.badgeText}>
            {item.type === "lost" ? "Lost" : "Found"}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.catChip}>
          <Text style={styles.catChipText}>{item.category}</Text>
        </View>
        {locationText ? (
          <Text style={styles.meta} numberOfLines={1}>
            <Text style={styles.metaLabel}>
              {item.type === "lost" ? "Last seen: " : "Found at: "}
            </Text>
            {locationText}
          </Text>
        ) : null}
        <Text style={styles.meta}>
          <Text style={styles.metaLabel}>Date: </Text>
          {date ? formatDate(date) : "—"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<ItemType | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const fetchItems = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await listItems({
          type: typeFilter === "all" ? undefined : typeFilter,
          q: search || undefined,
          status: "open",
          limit: 30,
        });
        setItems(res.items);
        setTotal(res.total);
      } catch {
        // show empty list on error
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [typeFilter, search]
  );

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor={colors.textMuted}
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={() => setSearch(searchInput)}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.tabs}>
        {TYPES.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.tab, typeFilter === t.value && styles.tabActive]}
            onPress={() => setTypeFilter(t.value)}
          >
            <Text
              style={[
                styles.tabText,
                typeFilter === t.value && styles.tabTextActive,
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.brand} size="large" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() =>
                navigation.navigate("ItemDetail", { id: item.id })
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No items found.</Text>
          }
          ListHeaderComponent={
            <Text style={styles.resultCount}>{total} item(s)</Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchItems(true)}
              colors={[colors.brand]}
              tintColor={colors.brand}
            />
          }
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchRow: {
    padding: 12,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.brand },
  tabText: { color: colors.textMuted, fontWeight: "500", fontSize: 14 },
  tabTextActive: { color: colors.brand, fontWeight: "700" },
  resultCount: {
    paddingHorizontal: 4,
    paddingVertical: 10,
    color: colors.textMuted,
    fontSize: 13,
  },
  row: { gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
    ...shadow.sm,
  },
  imageWrap: {
    aspectRatio: 4 / 3,
    backgroundColor: colors.surfaceAlt,
    position: "relative",
  },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.brandBg,
  },
  placeholderLetter: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.brandDark,
  },
  badge: {
    position: "absolute",
    top: 6,
    left: 6,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeLost: { backgroundColor: colors.brand },
  badgeFound: { backgroundColor: colors.success },
  badgeText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  body: { padding: 10, gap: 4 },
  title: { fontSize: 14, fontWeight: "600", color: colors.text, lineHeight: 20 },
  catChip: {
    alignSelf: "flex-start",
    backgroundColor: colors.brandBg,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  catChipText: { fontSize: 11, fontWeight: "500", color: colors.brandDark },
  meta: { fontSize: 12, color: colors.textMuted },
  metaLabel: { fontWeight: "500", color: colors.textMuted },
  empty: {
    textAlign: "center",
    marginTop: 60,
    color: colors.textMuted,
    fontSize: 16,
  },
});
