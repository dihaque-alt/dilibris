/** Fixed photo room + vignette scrim (Claude Design handoff). */
export function RoomBackdrop() {
  return (
    <>
      <div className="dl-room" aria-hidden="true">
        <div className="dl-photo" />
        <div className="dl-photo-grade" />
      </div>
      <div className="dl-grade" aria-hidden="true" />
    </>
  );
}
