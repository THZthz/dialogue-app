import { WorldEntity, WorldState, Character, Location, WorldObject } from '@/types/entities';

class WorldManager {
  private state: WorldState = {
    objects: {},
    locations: {},
    characters: {}
  };

  async loadState() {
    const res = await fetch('/api/world');
    if (res.ok) {
      this.state = await res.json();
    }
  }

  getEntity(id: string): WorldEntity | undefined {
    return this.state.objects[id] || this.state.locations[id] || this.state.characters[id];
  }

  updateEntity(entity: Partial<WorldEntity> & { id: string }) {
    const existing = this.getEntity(entity.id);
    if (!existing) return;

    if (existing.type === 'OBJECT') {
      this.state.objects[entity.id] = { ...this.state.objects[entity.id], ...entity } as WorldObject;
    } else if (existing.type === 'LOCATION') {
      this.state.locations[entity.id] = { ...this.state.locations[entity.id], ...entity } as Location;
    } else if (existing.type === 'CHARACTER') {
      this.state.characters[entity.id] = { ...this.state.characters[entity.id], ...entity } as Character;
    }
  }

  getState(): WorldState {
    return this.state;
  }

  getAllEntities(): WorldEntity[] {
    return [
      ...Object.values(this.state.objects),
      ...Object.values(this.state.locations),
      ...Object.values(this.state.characters)
    ];
  }
}

export const worldManager = new WorldManager();

