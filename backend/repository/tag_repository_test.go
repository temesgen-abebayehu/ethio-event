package repository

import (
	"context"
	"testing"
)

func TestTagRepository_List(t *testing.T) {
	requireDB(t)
	resetData(t)

	user := seedUser(t, "owner@e.com")
	seedEvent(t, user.ID, 0, 10) // seeds the "jazz" tag via event_tags

	tags, err := NewTagRepository(testPool).List(context.Background())
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	found := false
	for _, tag := range tags {
		if tag.Name == "jazz" {
			found = true
		}
	}
	if !found {
		t.Error("expected 'jazz' tag to be listed")
	}
}
