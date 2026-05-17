import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { colors, radius, shadow } from "../theme";

const WEB_APP_URL = "https://cufinder.vercel.app";

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.brandRow}>
          <Text style={styles.brandMark}>CU</Text>
          <Text style={styles.brandRest}>Finder</Text>
        </View>
        <Text style={styles.tagline}>
          Lost & Found for Chulalongkorn University
        </Text>

        <View style={styles.divider} />

        <Text style={styles.body}>
          Sign in with your CU email to post lost or found items.{"\n\n"}
          <Text style={styles.domain}>@chula.ac.th</Text>
          {"  ·  "}
          <Text style={styles.domain}>@student.chula.ac.th</Text>
        </Text>

        <TouchableOpacity
          style={styles.googleBtn}
          onPress={() => Linking.openURL(WEB_APP_URL)}
          activeOpacity={0.85}
        >
          <Text style={styles.googleG}>G</Text>
          <Text style={styles.googleText}>Sign in with Google</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          You'll be taken to the web app to complete sign‑in.{"\n"}
          Browsing items does not require login.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brandBg,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    width: "100%",
    alignItems: "center",
    ...shadow.md,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  brandMark: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.brand,
  },
  brandRest: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 24,
  },
  body: {
    fontSize: 15,
    color: colors.text,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 28,
  },
  domain: { fontWeight: "700", color: colors.brand },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    justifyContent: "center",
    marginBottom: 20,
  },
  googleG: {
    color: colors.textInverse,
    fontWeight: "900",
    fontSize: 18,
    fontStyle: "italic",
  },
  googleText: {
    color: colors.textInverse,
    fontWeight: "700",
    fontSize: 16,
  },
  note: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
});
