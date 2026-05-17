import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { getItem, imageUrl } from "../api/items";
import type { Item } from "../types";
import type { RootStackParamList } from "../../App";
import { colors, radius, shadow } from "../theme";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ItemDetail">;
  route: RouteProp<RootStackParamList, "ItemDetail">;
};

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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ItemDetailScreen({ route }: Props) {
  const { id } = route.params;
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getItem(id)
      .then(setItem)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load item.</Text>
      </View>
    );
  }

  const isLost = item.type === "lost";
  const date = isLost ? item.last_seen_date : item.found_date;
  const locationText = isLost
    ? item.last_seen_location_text
    : item.found_location_text;
  const heldAt = !isLost ? item.held_freetext : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {item.image_id ? (
        <Image
          source={{ uri: imageUrl(item.image_id) }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderLetter}>
            {item.category[0] ?? "?"}
          </Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, isLost ? styles.badgeLost : styles.badgeFound]}>
            <Text style={styles.badgeText}>
              {isLost ? "Lost" : "Found"}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.title}>{item.title}</Text>

        <View style={styles.catChip}>
          <Text style={styles.catChipText}>{item.category}</Text>
        </View>

        <Text style={styles.sectionLabel}>Description</Text>
        <Text style={styles.description}>{item.description}</Text>

        <Text style={styles.sectionLabel}>Details</Text>
        <View style={styles.infoBox}>
          {date && (
            <InfoRow
              label={isLost ? "Last seen date" : "Found date"}
              value={formatDate(date)}
            />
          )}
          {locationText && (
            <InfoRow
              label={isLost ? "Last seen at" : "Found at"}
              value={locationText}
            />
          )}
          {heldAt && <InfoRow label="Currently held at" value={heldAt} />}
          {!isLost && !item.held_freetext && item.held_admin_location_id && (
            <InfoRow label="Held at" value="Campus drop-off location" />
          )}
          {isLost && item.contact_info && (
            <InfoRow label="Contact" value={item.contact_info} />
          )}
          <InfoRow label="Posted by" value={item.posted_by.display_name} />
          <InfoRow
            label="Posted"
            value={formatDate(item.posted_at)}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 48 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: colors.error, fontSize: 16 },
  image: { width: "100%", height: 280 },
  imagePlaceholder: {
    width: "100%",
    height: 220,
    backgroundColor: colors.brandBg,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderLetter: {
    fontSize: 64,
    fontWeight: "700",
    color: colors.brandDark,
  },
  body: { padding: 16 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeLost: { backgroundColor: colors.brand },
  badgeFound: { backgroundColor: colors.success },
  badgeText: {
    color: colors.textInverse,
    fontWeight: "600",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  statusText: {
    fontWeight: "500",
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "capitalize",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
    lineHeight: 28,
  },
  catChip: {
    alignSelf: "flex-start",
    backgroundColor: colors.brandBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 4,
  },
  catChipText: { fontSize: 12, fontWeight: "500", color: colors.brandDark },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 20,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 23,
  },
  infoBox: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: { color: colors.textMuted, fontSize: 14 },
  infoValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
});
