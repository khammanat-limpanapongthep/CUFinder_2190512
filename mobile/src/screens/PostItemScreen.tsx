import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import { listLocations } from "../api/locations";
import { createItem } from "../api/items";
import { getMe } from "../api/auth";
import type { Location, ItemType } from "../types";
import { CATEGORIES } from "../types";
import { colors, radius } from "../theme";

const today = new Date().toISOString().split("T")[0];
const WEB_APP_URL = "https://cufinder.vercel.app";

export default function PostItemScreen() {
  const [itemType, setItemType] = useState<ItemType>("lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [locationText, setLocationText] = useState("");
  const [date, setDate] = useState(today);
  const [contactInfo, setContactInfo] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listLocations().then(setLocations).catch(() => {});
  }, []);

  async function handleSubmit() {
    if (!title.trim() || !description.trim() || !locationText.trim()) {
      Alert.alert("Missing fields", "Please fill in title, description, and location.");
      return;
    }

    setSubmitting(true);

    const user = await getMe();
    if (!user) {
      setSubmitting(false);
      Alert.alert(
        "Sign in required",
        "You need to sign in with your CU Google account to post an item.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign in",
            onPress: () => Linking.openURL(WEB_APP_URL),
          },
        ]
      );
      return;
    }

    try {
      const body =
        itemType === "lost"
          ? {
              type: "lost",
              title: title.trim(),
              description: description.trim(),
              category,
              image_id: null,
              last_seen_location_id: null,
              last_seen_location_text: locationText.trim(),
              last_seen_date: date,
              contact_info: contactInfo.trim() || null,
            }
          : {
              type: "found",
              title: title.trim(),
              description: description.trim(),
              category,
              image_id: null,
              found_location_id: null,
              found_location_text: locationText.trim(),
              found_date: date,
              held_admin_location_id: null,
              held_freetext: "Contact poster",
            };

      await createItem(body);
      Alert.alert("Posted!", "Your item has been reported successfully.", [
        {
          text: "OK",
          onPress: () => {
            setTitle("");
            setDescription("");
            setLocationText("");
            setContactInfo("");
            setDate(today);
          },
        },
      ]);
    } catch {
      Alert.alert("Error", "Failed to post item. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Type toggle */}
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, itemType === "lost" && styles.typeBtnActive]}
          onPress={() => setItemType("lost")}
        >
          <Text style={[styles.typeBtnText, itemType === "lost" && styles.typeBtnTextActive]}>
            Lost Item
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, itemType === "found" && styles.typeBtnActive]}
          onPress={() => setItemType("found")}
        >
          <Text style={[styles.typeBtnText, itemType === "found" && styles.typeBtnTextActive]}>
            Found Item
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Blue student ID card"
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Describe the item in detail..."
        placeholderTextColor={colors.textMuted}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={{ gap: 8 }}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, category === cat && styles.catChipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>
        {itemType === "lost" ? "Last seen location" : "Found location"}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Faculty of Engineering, 3rd floor"
        placeholderTextColor={colors.textMuted}
        value={locationText}
        onChangeText={setLocationText}
      />

      <Text style={styles.label}>
        {itemType === "lost" ? "Last seen date" : "Found date"}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textMuted}
        value={date}
        onChangeText={setDate}
        keyboardType="numeric"
      />

      {itemType === "lost" && (
        <>
          <Text style={styles.label}>Contact info (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. DM @username on IG"
            placeholderTextColor={colors.textMuted}
            value={contactInfo}
            onChangeText={setContactInfo}
          />
        </>
      )}

      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={styles.submitText}>Post Item</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 60 },
  typeRow: {
    flexDirection: "row",
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  typeBtnActive: { backgroundColor: colors.brandBg },
  typeBtnText: { fontWeight: "500", color: colors.textMuted, fontSize: 14 },
  typeBtnTextActive: { color: colors.brand, fontWeight: "700" },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
    fontSize: 15,
    color: colors.text,
  },
  textarea: { minHeight: 100 },
  categoryScroll: { marginBottom: 4 },
  catChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.brandBg, borderColor: colors.brandLight },
  catChipText: { color: colors.textMuted, fontSize: 13 },
  catChipTextActive: { color: colors.brandDark, fontWeight: "600" },
  submitBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 28,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: colors.textInverse, fontWeight: "700", fontSize: 16 },
});
