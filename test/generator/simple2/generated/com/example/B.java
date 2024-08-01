package com.example;

import javax.persistence.Entity;

@Entity
public class B {
    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
