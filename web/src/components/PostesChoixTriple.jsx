import PosteViseSelect from "./PosteViseSelect";

export default function PostesChoixTriple({
  choice1,
  choice2,
  choice3,
  setChoice1,
  setChoice2,
  setChoice3,
  disabled = false,
}) {
  function onChangeChoice1(v) {
    setChoice1(v);
    if (v && v === choice2) setChoice2("");
    if (v && v === choice3) setChoice3("");
  }

  function onChangeChoice2(v) {
    if (v && v === choice1) return;
    setChoice2(v);
    if (v && v === choice3) setChoice3("");
  }

  function onChangeChoice3(v) {
    if (v && v === choice1) return;
    if (v && v === choice2) return;
    setChoice3(v);
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 13, opacity: 0.9 }}>
          1er choix (obligatoire)
        </label>
        <PosteViseSelect
          value={choice1}
          onChange={onChangeChoice1}
          required
          disabled={disabled}
          placeholder="Sélectionner le 1er choix"
          excludeIds={[choice2, choice3].filter(Boolean)}
        />
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 13, opacity: 0.9 }}>
          2e choix (facultatif)
        </label>
        <PosteViseSelect
          value={choice2}
          onChange={onChangeChoice2}
          disabled={disabled}
          placeholder="Sélectionner le 2e choix (optionnel)"
          excludeIds={[choice1, choice3].filter(Boolean)}
        />
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 13, opacity: 0.9 }}>
          3e choix (facultatif)
        </label>
        <PosteViseSelect
          value={choice3}
          onChange={onChangeChoice3}
          disabled={disabled}
          placeholder="Sélectionner le 3e choix (optionnel)"
          excludeIds={[choice1, choice2].filter(Boolean)}
        />
      </div>
    </div>
  );
}